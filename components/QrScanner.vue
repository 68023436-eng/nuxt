<script setup lang="ts">
/**
 * QrScanner
 * กล้องสแกน QR Code ภายในหน้าเว็บ (browser camera) สำหรับ รปภ.
 *
 * - ขอ Camera Permission จาก browser (getUserMedia ผ่าน html5-qrcode)
 * - ป้องกัน decode ซ้ำ (html5-qrcode อาจยิง callback เดียวกันหลายครั้ง)
 * - จัดการกรณี: ปฏิเสธกล้อง / ไม่มีกล้อง / กล้องติด — โชว์ข้อความ + สำรองกรอก token เอง
 */

const props = defineProps<{ open?: boolean }>()
const emit = defineEmits<{
  decoded: [value: string]
  error: [message: string]
  cancel: []
}>()

const CONTAINER_ID = 'qr-reader-region'

const status = ref<'starting' | 'scanning' | 'error'>('starting')
const errorMsg = ref('')
const manualMode = ref(false)
const manualValue = ref('')
const decodedOnce = ref(false)

let scanner: any = null

const humanizeError = (err: unknown): string => {
  const m = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  if (m.includes('NotAllowedError') || m.includes('PermissionDenied') || m.includes('permission')) {
    return 'ถูกปฏิเสธการเข้าถึงกล้อง กรุณาอนุญาตให้เว็บไซต์ใช้กล้องในการตั้งค่าของเบราว์เซอร์'
  }
  if (m.includes('NotFoundError') || m.includes('No camera') || m.includes('device')) {
    return 'ไม่พบกล้องบนอุปกรณ์นี้'
  }
  if (m.includes('NotReadableError') || m.includes('Camera busy') || m.includes('busy')) {
    return 'กล้องถูกใช้งานจากแอปพลิเคชันอื่นอยู่ กรุณาปิดแล้วลองใหม่'
  }
  if (m.includes('secure') || m.includes('localhost') || m.includes('http')) {
    return 'การสแกนด้วยกล้องต้องใช้การเชื่อมต่อ HTTPS (หรือ localhost)'
  }
  return `ไม่สามารถเปิดกล้องได้ (${m || 'ไม่ทราบสาเหตุ'})`
}

const startScanner = async () => {
  status.value = 'starting'
  errorMsg.value = ''
  decodedOnce.value = false

  const { Html5Qrcode } = await import('html5-qrcode')
  try {
    if (scanner) {
      await scanner.stop().catch(() => {})
      scanner.clear().catch(() => {})
    }
  } catch {}

  scanner = new Html5Qrcode(CONTAINER_ID, {
    verbose: false,
    experimentalFeatures: {
      useBarCodeDetectorIfSupported: true,
    },
  })

  // คำนวณขนาดกรอบเล็งให้ยืดหยุ่นตามความกว้างของหน้าจอ
  const qrBoxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
    const edgeSize = Math.floor(minEdge * 0.72)
    return {
      width: Math.max(edgeSize, 180),
      height: Math.max(edgeSize, 180),
    }
  }

  try {
    await scanner.start(
      { facingMode: 'environment' },
      { 
        fps: 10, 
        qrbox: qrBoxFunction,
        aspectRatio: 1.0,
      },
      (decodedText: string) => {
        if (decodedOnce.value || !decodedText?.trim()) return
        decodedOnce.value = true
        stopScanner()
        emit('decoded', decodedText.trim())
      },
      () => {
        // frame decode error (ปล่อยผ่านให้กล้องรันต่อ)
      },
    )
    status.value = 'scanning'
  } catch (err) {
    status.value = 'error'
    errorMsg.value = humanizeError(err)
    emit('error', errorMsg.value)
  }
}

const stopScanner = () => {
  if (!scanner) return
  try {
    scanner.stop().catch(() => {})
    scanner.clear().catch(() => {})
    scanner = null
  } catch {}
}

const close = () => {
  stopScanner()
  emit('cancel')
}

const submitManual = () => {
  const val = manualValue.value.trim()
  if (!val) return
  emit('decoded', val)
}

watch(
  () => props.open,
  (val) => {
    if (val) startScanner()
    else stopScanner()
  },
  { flush: 'post' },
)

onMounted(() => {
  if (props.open) startScanner()
})

onUnmounted(() => {
  stopScanner()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-3 sm:tw-p-4">
        <!-- ฉากหลังสีดำโปร่งแสง -->
        <div class="tw-fixed tw-inset-0 tw-bg-black/70 tw-backdrop-blur-sm" @click="close"></div>

        <!-- กล่องหน้าต่าง Modal กล้อง -->
        <div class="tw-relative tw-bg-white tw-rounded-2xl sm:tw-rounded-3xl tw-shadow-2xl tw-w-full tw-max-w-sm sm:tw-max-w-md tw-max-h-[92vh] tw-flex tw-flex-col tw-overflow-hidden tw-transform tw-transition-all">
          
          <!-- ส่วนหัว Header -->
          <div class="tw-bg-gradient-to-r tw-from-sky-500 tw-to-blue-600 tw-px-4 sm:tw-px-6 tw-py-3.5 sm:tw-py-4 tw-flex tw-items-center tw-justify-between">
            <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-white tw-flex tw-items-center tw-gap-2">
              <span>📷</span> สแกน QR Code
            </h2>
            <button
              @click="close"
              class="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-white/80 hover:tw-text-white hover:tw-bg-white/10 tw-transition-colors tw-text-xl tw-leading-none"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>

          <!-- เนื้อหา Body (เลื่อนได้ถ้าจอเตี้ย) -->
          <div class="tw-p-4 sm:tw-p-5 tw-space-y-3.5 sm:tw-space-y-4 tw-overflow-y-auto tw-flex-1 tw-min-h-0">
            
            <!-- กรอบแสดงภาพจากกล้อง -->
            <div class="tw-relative tw-bg-slate-900 tw-rounded-xl sm:tw-rounded-2xl tw-overflow-hidden tw-border tw-border-slate-800">
              
              <!-- Container สำหรับ html5-qrcode -->
              <div
                :id="CONTAINER_ID"
                class="tw-w-full tw-min-h-[260px] sm:tw-min-h-[290px] tw-flex tw-items-center tw-justify-center"
              ></div>

              <!-- ข้อความแสดงสถานะกำลังเปิดกล้อง -->
              <div v-if="status === 'starting'" class="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2.5 tw-bg-slate-900 tw-text-white tw-z-10">
                <div class="tw-w-9 sm:tw-w-10 tw-h-9 sm:tw-h-10 tw-border-4 tw-border-white/20 tw-border-t-sky-400 tw-rounded-full tw-animate-spin"></div>
                <p class="tw-text-xs sm:tw-text-sm tw-text-white/80 tw-font-medium">กำลังเปิดกล้อง...</p>
              </div>
            </div>

            <!-- ข้อความแนะนำ -->
            <p class="tw-text-center tw-text-xs sm:tw-text-sm tw-text-slate-500">
              หันกล้องไปที่ QR Code ให้พอดีกับกรอบสแกน
            </p>

            <!-- กรณีกล้องมีปัญหา หรือเปิดไม่ได้ -->
            <div v-if="status === 'error'" class="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-p-3.5 sm:tw-p-4 tw-space-y-3">
              <p class="tw-text-red-600 tw-text-xs sm:tw-text-sm tw-font-medium leading-relaxed">
                ⚠️ {{ errorMsg }}
              </p>

              <div class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2">
                <button
                  @click="startScanner"
                  type="button"
                  class="tw-w-full sm:tw-flex-1 tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-xs sm:tw-text-sm tw-font-semibold tw-py-2.5 tw-px-4 tw-rounded-xl tw-transition-colors"
                >
                  ลองใหม่อีกครั้ง
                </button>
                <button
                  @click="manualMode = !manualMode"
                  type="button"
                  class="tw-w-full sm:tw-flex-1 tw-bg-slate-200 hover:tw-bg-slate-300 tw-text-gray-700 tw-text-xs sm:tw-text-sm tw-font-medium tw-py-2.5 tw-px-4 tw-rounded-xl tw-transition-colors"
                >
                  {{ manualMode ? 'ซ่อนกรอกด้วยมือ' : 'กรอก QR Token เอง' }}
                </button>
              </div>

              <!-- ช่องสำรองกรอกด้วยมือ -->
              <div v-if="manualMode" class="tw-space-y-2 tw-pt-1">
                <input
                  v-model="manualValue"
                  type="text"
                  placeholder="วางหรือพิมพ์ QR-Token ที่นี่..."
                  class="tw-w-full tw-px-3.5 tw-py-2.5 tw-rounded-xl tw-border tw-border-slate-300 tw-text-xs sm:tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-sky-400 tw-bg-white"
                  @keyup.enter="submitManual"
                />
                <button
                  @click="submitManual"
                  type="button"
                  class="tw-w-full tw-bg-sky-600 hover:tw-bg-sky-700 tw-text-white tw-text-xs sm:tw-text-sm tw-font-semibold tw-py-2.5 tw-px-4 tw-rounded-xl tw-transition-colors"
                >
                  ตรวจสอบสิทธิ์
                </button>
              </div>
            </div>

          </div>

          <!-- ส่วนท้าย Footer -->
          <div class="tw-px-4 sm:tw-px-6 tw-py-3.5 sm:tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-between tw-items-center">
            <span class="tw-text-[11px] sm:tw-text-xs tw-text-slate-400 tw-font-mono">Smart QR Parking</span>
            <button
              @click="close"
              type="button"
              class="tw-bg-slate-200 hover:tw-bg-slate-300 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-5 tw-rounded-xl tw-text-xs sm:tw-text-sm tw-transition-colors"
            >
              ยกเลิก
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* จัดการสไตล์ของ video tag ที่ html5-qrcode สร้างขึ้นมาให้อยู่ในกรอบอย่างสวยงาม */
:deep(#qr-reader-region video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  border-radius: 0.75rem !important;
}

:deep(#qr-reader-region__scan_region) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>