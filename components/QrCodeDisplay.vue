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
    /** ขนาดความกว้างตอนแสดงผล (px) */
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
  <!-- แสดง placeholder เมื่อยังไม่มี token -->
  <div
    v-if="!hasValue"
    class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-bg-slate-50 tw-border-2 tw-border-dashed tw-border-slate-200 tw-rounded-xl tw-py-8 tw-px-4 tw-text-center"
  >
    <span class="tw-text-3xl">🔳</span>
    <p class="tw-text-sm tw-font-medium tw-text-slate-500">ยังไม่มีการสร้าง QR Code สำหรับรายการนี้</p>
    <p class="tw-text-xs tw-text-slate-400">กรุณาสร้างรายการนัดหมายใหม่ เพื่อรับ QR Token สำหรับเข้าจอดรถ</p>
  </div>

  <!-- แสดง error ตอน generate -->
  <div
    v-else-if="error"
    class="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-py-8 tw-px-4 tw-text-center"
  >
    <span class="tw-text-3xl">⚠️</span>
    <p class="tw-text-sm tw-font-medium tw-text-red-600">ไม่สามารถสร้างรูป QR Code ได้</p>
  </div>

  <!-- QR Code (เพิ่ม quiet zone ด้วย bg-white + padding) -->
  <div
    v-else
    class="tw-inline-flex tw-flex-col tw-items-center tw-gap-2"
  >
    <img
      v-if="dataUrl"
      :src="dataUrl"
      :alt="`QR Code สำหรับนัดหมาย`"
      :width="size"
      :height="size"
      class="tw-block tw-bg-white tw-p-2 tw-rounded-lg tw-ring-2 tw-ring-slate-200 tw-shadow-sm"
    />
    <div
      v-else
      class="tw-flex tw-items-center tw-justify-center tw-bg-white tw-rounded-lg tw-ring-2 tw-ring-slate-200"
      :style="{ width: size + 'px', height: size + 'px' }"
    >
      <div class="tw-w-8 tw-h-8 tw-border-4 tw-border-slate-300 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
    </div>
  </div>
</template>