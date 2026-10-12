<script setup lang="ts">
/**
 * ScanResultCard
 * ผลการตรวจสอบสิทธิ์จอดรถ — แสดงเพียง 2 สถานะ ใหญ่/ชัดเจน
 * มีสิทธิ์: ✓ สีเขียว | ไม่มีสิทธิ์: ✕ สีแดง
 * ห้ามแสดงข้อมูลผู้ป่วย/ทะเบียนรถ/วันนัดหมายใดๆ
 */

defineProps<{
  ok: boolean
  /** ข้อความเหตุผลสั้นๆ (ภาษาไทย กลางๆ) — เพื่อให้ รปภ. อธิบายต่อได้ ไม่รั่วข้อมูลผู้ป่วย/นัด */
  reason?: string | null
}>()
defineEmits<{ rescan: [] }>()
</script>

<template>
  <div
    :class="[
      'tw-w-full tw-rounded-2xl sm:tw-rounded-3xl tw-shadow-xl tw-border-2 sm:tw-border-4 tw-p-5 sm:tw-p-8 md:tw-p-10 tw-flex tw-flex-col tw-items-center tw-gap-3 sm:tw-gap-4 tw-text-center tw-transition-all',
      ok
        ? 'tw-bg-green-50/90 tw-border-green-500 tw-text-green-700'
        : 'tw-bg-red-50/90 tw-border-red-500 tw-text-red-700',
    ]"
  >
    <!-- เครื่องหมายผลลัพธ์ ใหญ่และชัดเจน (Adaptive Circle) -->
    <div
      :class="[
        'tw-w-28 tw-h-28 sm:tw-w-36 sm:tw-h-36 md:tw-w-40 md:tw-h-40 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-white tw-shadow-lg tw-transition-transform tw-duration-300',
        ok ? 'tw-bg-green-500' : 'tw-bg-red-500',
      ]"
    >
      <span class="tw-text-6xl sm:tw-text-7xl md:tw-text-8xl tw-leading-none tw-font-bold tw-select-none">
        {{ ok ? '✓' : '✕' }}
      </span>
    </div>

    <!-- ข้อความผลลัพธ์ -->
    <div class="tw-space-y-1">
      <h2
        :class="[
          'tw-text-3xl sm:tw-text-4xl md:tw-text-5xl tw-font-extrabold tw-tracking-wide',
          ok ? 'tw-text-green-700' : 'tw-text-red-700',
        ]"
      >
        {{ ok ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์' }}
      </h2>

      <p class="tw-text-sm sm:tw-text-base md:tw-text-lg tw-font-semibold tw-opacity-80">
        {{ ok ? 'อนุญาตให้จอดรถได้' : 'ไม่อนุญาตให้จอดรถ' }}
      </p>
    </div>

    <!-- เหตุผลสั้นๆ (ถ้ามี) -->
    <div v-if="!ok && reason" class="tw-w-full tw-max-w-md">
      <p class="tw-text-xs sm:tw-text-sm md:tw-text-base tw-font-medium tw-text-slate-700 tw-bg-white/80 tw-backdrop-blur-sm tw-px-4 tw-py-2.5 tw-rounded-xl tw-border tw-border-red-200/60 tw-shadow-sm">
        {{ reason }}
      </p>
    </div>

    <!-- ปุ่มกลับไปสแกน/ค้นหาใหม่ -->
    <div class="tw-w-full sm:tw-w-auto tw-pt-2">
      <button
        @click="$emit('rescan')"
        type="button"
        class="tw-w-full sm:tw-w-auto tw-bg-white hover:tw-bg-slate-50 tw-border tw-border-slate-300 tw-text-slate-700 hover:tw-text-slate-900 tw-font-bold tw-text-sm sm:tw-text-base tw-px-8 tw-py-3 sm:tw-py-3.5 tw-rounded-xl tw-shadow-sm hover:tw-shadow tw-transition-all tw-flex tw-items-center tw-justify-center tw-gap-2"
      >
        <span>📷</span>
        <span>สแกนอีกครั้ง</span>
      </button>
    </div>
  </div>
</template>