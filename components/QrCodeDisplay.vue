<script setup lang="ts">
/**
 * QrCodeDisplay
 * แสดง QR Code จาก qr_token แบบ Responsive + High-contrast สำหรับการสแกน
 * - สร้างรูปฝั่ง client (dynamic import "qrcode") เพื่อไม่ให้รบกวน SSR
 * - Handle กรณี value เป็น null / '': แสดง placeholder แทนรูป
 * - รองรับการพิมพ์เฉพาะ QR Code สำหรับใส่ใบเสร็จ
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** ค่า token ที่จะเข้ารหัสเป็น QR Code (ถ้า null/'' จะแสดง placeholder) */
    value: string | null | undefined
    /** ขนาดความกว้างตอนแสดงผลสูงสุด (px) */
    size?: number
    /** แสดงปุ่มพิมพ์หรือไม่ */
    showPrintButton?: boolean
    /** ขนาด QR Code เมื่อพิมพ์ (มิลลิเมตร) - เหมาะกับใบเสร็จร้านสะดวกซื้อ */
    printSizeMm?: number
    /** ความกว้าง QR Code สำหรับการพิมพ์ (px) - กำหนดเองถ้าต้องการขนาดใหญ่ */
    printWidthPx?: number | null
  }>(),
  {
    size: 200,
    showPrintButton: true,
    printSizeMm: 70, // ขนาด QR บนใบเสร็จ (เพิ่มขึ้นเล็กน้อย)
    printWidthPx: null,
  },
)

const dataUrl = shallowRef<string | null>(null)
const error = ref(false)
const qrRef = ref<HTMLElement | null>(null)

const hasValue = computed(() => typeof props.value === 'string' && props.value.trim().length > 0)

const generate = async () => {
  error.value = false
  dataUrl.value = null
  if (!hasValue.value) return

  try {
    const mod: any = await import('qrcode')
    const QRCode = mod.default || mod
    // width สูงกว่าขนาดแสดงผล ~3 เท่า เพื่อให้คมชัดบนจอ Retina และพิมพ์คมชัด
    const printWidth = props.printWidthPx ? Math.max(400, props.printWidthPx) : Math.max(400, props.size * 5)
    dataUrl.value = await QRCode.toDataURL(props.value!.trim(), {
      width: Math.max(400, printWidth),
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000ff', light: '#ffffffff' },
    })
  } catch (e) {
    console.error('QR generation error:', e)
    error.value = true
  }
}

const handlePrint = () => {
  if (!hasValue.value || !dataUrl.value) return
  
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    window.print()
    return
  }

  const mmToPx = (mm: number) => Math.round((mm * 96) / 25.4)
  const qrSizePx = props.printWidthPx ? Math.max(300, props.printWidthPx) : Math.max(350, mmToPx(props.printSizeMm))

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>QR Code Print</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            background: white;
          }
          .qr-print {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
          }
          img {
            width: ${qrSizePx}px;
            height: ${qrSizePx}px;
            object-fit: contain;
          }
          @page {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="qr-print">
          <img src="${dataUrl.value}" alt="QR Code" />
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

onMounted(generate)
watch(() => props.value, generate)

defineExpose({
  print: handlePrint,
})
</script>

<template>
  <!-- 1. แสดง placeholder เมื่อยังไม่มี token -->
  <div
    v-if="!hasValue"
    class="tw-w-full tw-max-w-xs sm:tw-max-w-sm tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-bg-slate-50 tw-border-2 tw-border-dashed tw-border-slate-200 tw-rounded-xl sm:tw-rounded-2xl tw-py-6 sm:tw-py-8 tw-px-4 tw-text-center tw-transition-all"
  >
    <span class="tw-text-2xl sm:tw-text-3xl">🔳</span>
    <p class="tw-text-xs sm:tw-text-sm tw-font-semibold tw-text-slate-600">ยังไม่มีการสร้าง QR Code สำหรับรายการนี้</p>
    <p class="tw-text-[11px] sm:tw-text-xs tw-text-slate-400">กรุณาสร้างรายการนัดหมายใหม่ เพื่อรับ QR Token สำหรับเข้าจอดรถ</p>
  </div>

  <!-- 2. แสดง error ตอนสร้างรูปไม่สำเร็จ -->
  <div
    v-else-if="error"
    class="tw-w-full tw-max-w-xs sm:tw-max-w-sm tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl sm:tw-rounded-2xl tw-py-6 sm:tw-py-8 tw-px-4 tw-text-center tw-transition-all"
  >
    <span class="tw-text-2xl sm:tw-text-3xl">⚠️</span>
    <p class="tw-text-xs sm:tw-text-sm tw-font-semibold tw-text-red-600">ไม่สามารถสร้างรูป QR Code ได้</p>
  </div>

  <!-- 3. กรอบแสดงภาพ QR Code แบบยืดหยุ่น (Responsive Quiet Zone) -->
  <div
    v-else
    class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full qr-display-container"
  >
    <!-- ส่วน QR Code สำหรับพิมพ์ (แสดงเฉพาะตอนพิมพ์) -->
    <div
      ref="qrRef"
      class="qr-print-area"
      :style="printWidthPx ? { width: `${printWidthPx}px`, height: `${printWidthPx}px` } : { width: `${Math.max(70, printSizeMm)}mm`, height: `${Math.max(70, printSizeMm)}mm` }"
    >
      <div
        class="tw-relative tw-flex tw-items-center tw-justify-center tw-bg-white tw-w-full tw-h-full tw-p-1"
      >
        <!-- ภาพ QR Code -->
        <img
          v-if="dataUrl"
          :src="dataUrl"
          alt="QR Code สำหรับนัดหมาย"
          class="tw-w-full tw-h-full tw-block tw-object-contain tw-select-none"
        />
        <!-- Spinner ระหว่างรอ Render ภาพ -->
        <div
          v-else
          class="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center"
        >
          <div class="tw-w-8 sm:tw-w-10 tw-h-8 sm:tw-h-10 tw-border-4 tw-border-slate-200 tw-border-t-sky-500 tw-rounded-full tw-animate-spin"></div>
        </div>
      </div>
    </div>

    <!-- ส่วน QR Code สำหรับแสดงผลบนหน้าจอ -->
    <div
      class="qr-screen-view tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full"
    >
      <div
        class="tw-relative tw-flex tw-items-center tw-justify-center tw-bg-white tw-p-2.5 sm:tw-p-3 tw-rounded-xl sm:tw-rounded-2xl tw-ring-2 tw-ring-slate-200/80 tw-shadow-sm hover:tw-shadow-md tw-transition-all"
        :style="{ maxWidth: `${size}px`, width: '100%' }"
      >
        <!-- ภาพ QR Code -->
        <img
          v-if="dataUrl"
          :src="dataUrl"
          alt="QR Code สำหรับนัดหมาย"
          class="tw-w-full tw-h-auto tw-max-w-full tw-aspect-square tw-block tw-object-contain tw-rounded-lg tw-select-none"
        />

        <!-- Spinner ระหว่างรอ Render ภาพ -->
        <div
          v-else
          class="tw-w-full tw-aspect-square tw-flex tw-items-center tw-justify-center"
        >
          <div class="tw-w-8 sm:tw-w-10 tw-h-8 sm:tw-h-10 tw-border-4 tw-border-slate-200 tw-border-t-sky-500 tw-rounded-full tw-animate-spin"></div>
        </div>
      </div>

      <!-- ปุ่มพิมพ์ -->
      <button
        v-if="showPrintButton && dataUrl"
        @click="handlePrint"
        type="button"
        class="tw-mt-4 tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-lg tw-shadow-sm hover:tw-bg-blue-700 tw-transition-colors tw-font-medium tw-text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        พิมพ์ QR Code
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ซ่อนพื้นที่พิมพ์บนหน้าจอ */
.qr-print-area {
  display: none;
}

/* เมื่อพิมพ์ - แสดงเฉพาะ QR Code */
@media print {
  :deep(body) {
    margin: 0 !important;
    padding: 0 !important;
  }
  
  .qr-display-container > *:not(.qr-print-area) {
    display: none !important;
  }
  
  .qr-print-area {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
  }
}
</style>