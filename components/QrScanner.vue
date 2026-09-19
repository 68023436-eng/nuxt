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

  const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
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

  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText: string) => {
        // ป้องกันสแกน QR เดิมซ้ำ (decode เดียวกันออกมาหลายครั้ง)
        if (decodedOnce.value || !decodedText?.trim()) return
        decodedOnce.value = true
        stopScanner()
        emit('decoded', decodedText.trim())
      },
      () => {
        // onError (frame decode error) — ignore, ปล่อยให้กล้องทำงานต่อ
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

// ขึ้นอยู่กับ modal เปิด/ปิดจริงๆ (ไม่ใช้ onMounted อย่างเดียว)
// เพราะ QrScanner ถูก mount ตั้งแต่แรกแล้ว (ในตัว modal ใช้ v-if="open")
// และเมื่อปิด modal ต้องแจ้งกล้องหยุดถ่าย (กันกล้องยังทำงานค้างอยู่)
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
      <div v-if="open" class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4">
        <!-- Backdrop -->
        <div class="tw-fixed tw-inset-0 tw-bg-black/60 tw-backdrop-blur-sm" @click="close"></div>

        <!-- Camera Panel -->
        <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transform tw-transition-all">
          <!-- Header -->
          <div class="tw-bg-gradient-to-r tw-from-sky-500 tw-to-blue-600 tw-px-5 tw-py-4">
            <div class="tw-flex tw-items-center tw-justify-between">
              <h2 class="tw-text-lg tw-font-bold tw-text-white">📷 สแกน QR Code</h2>
              <button
                @click="close"
                class="tw-text-white/80 hover:tw-text-white tw-transition-colors tw-text-2xl tw-leading-none tw-font-light"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="tw-p-5 tw-space-y-4">
            <!-- พื้นที่กล้อง / สถานะ -->
            <div class="tw-relative tw-bg-slate-900 tw-rounded-xl tw-overflow-hidden">
              <!-- container สำหรับ html5-qrcode -->
              <div
                :id="CONTAINER_ID"
                class="tw-min-h-72 tw-flex tw-items-center tw-justify-center"
              ></div>

              <!-- Loading -->
              <div v-if="status === 'starting'" class="tw-absolute inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-text-white">
                <div class="tw-w-10 tw-h-10 tw-border-4 tw-border-white/30 tw-border-t-white tw-rounded-full tw-animate-spin"></div>
                <p class="tw-text-sm tw-text-white/80">กำลังเปิดกล้อง...</p>
              </div>
            </div>

            <!-- คำแนะนำ -->
            <p class="tw-text-center tw-text-sm tw-text-slate-500">
              วาง QR Code ให้อยู่ในกรอบสแกนด้านบน
            </p>

            <!-- กรณีเปิดกล้องไม่ได้ -->
            <div v-if="status === 'error'" class="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-p-4 tw-space-y-3">
              <p class="tw-text-red-600 tw-text-sm tw-font-medium">⚠️ {{ errorMsg }}</p>

              <div class="tw-flex tw-flex-wrap tw-gap-2">
                <button
                  @click="startScanner"
                  class="tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-sm tw-font-medium tw-px-4 tw-py-2 tw-rounded-lg tw-transition-colors"
                >
                  ลองใหม่อีกครั้ง
                </button>
                <button
                  @click="manualMode = !manualMode"
                  class="tw-bg-slate-200 hover:tw-bg-slate-300 tw-text-gray-700 tw-text-sm tw-font-medium tw-px-4 tw-py-2 tw-rounded-lg tw-transition-colors"
                >
                  {{ manualMode ? 'ซ่อนการกรอกด้วยมือ' : 'กรอก QR Token เอง' }}
                </button>
              </div>

              <!-- สำรอง: กรอก token ด้วยมือ -->
              <div v-if="manualMode" class="tw-space-y-2">
                <input
                  v-model="manualValue"
                  type="text"
                  placeholder="QR-XXXXXXXXXXXX..."
                  class="tw-w-full tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-border-slate-300 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-sky-400"
                  @keyup.enter="submitManual"
                />
                <button
                  @click="submitManual"
                  class="tw-w-full tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-text-sm tw-font-medium tw-px-4 tw-py-2 tw-rounded-lg tw-transition-colors"
                >
                  ตรวจสอบสิทธิ์
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="tw-px-5 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-between tw-items-center">
            <span class="tw-text-xs tw-text-slate-400">Smart QR Parking</span>
            <button
              @click="close"
              class="tw-bg-slate-200 hover:tw-bg-slate-300 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>