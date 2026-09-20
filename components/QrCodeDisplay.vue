<script setup lang="ts">
/**
 * QrCodeDisplay
 * แสดง QR Code จาก qr_token แบบ Responsive + High-contrast สำหรับการสแกน
 * - สร้างรูปฝั่ง client (dynamic import "qrcode") เพื่อไม่ให้รบกวน SSR
 * - Handle กรณี value เป็น null / '': แสดง placeholder แทนรูป
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** ค่า token ที่จะเข้ารหัสเป็น QR Code (ถ้า null/'' จะแสดง placeholder) */
    value: string | null | undefined
    /** ขนาดความกว้างตอนแสดงผลสูงสุด (px) */
    size?: number
  }>(),
  {
    size: 200,
  },
)

const dataUrl = shallowRef<string | null>(null)
const error = ref(false)

const hasValue = computed(() => typeof props.value === 'string' && props.value.trim().length > 0)

const generate = async () => {
  error.value = false
  dataUrl.value = null
  if (!hasValue.value) return

  try {
    const mod: any = await import('qrcode')
    const QRCode = mod.default || mod
    // width สูงกว่าขนาดแสดงผล ~3 เท่า เพื่อให้คมชัดบนจอ Retina รปภ. สแกนง่าย
    dataUrl.value = await QRCode.toDataURL(props.value!.trim(), {
      width: Math.max(150, props.size * 3),
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000ff', light: '#ffffffff' },
    })
  } catch (e) {
    console.error('QR generation error:', e)
    error.value = true
  }
}

onMounted(generate)
watch(() => props.value, generate)
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
    class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full"
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
  </div>
</template>