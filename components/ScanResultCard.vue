<script setup lang="ts">
/**
 * ScanResultCard
 * ผลการตรวจสอบสิทธิ์จอดรถ — แสดงเพียง 2 สถานะ ใหญ่/ชัดเจน
 * มีสิทธิ์: ✓ สีเขียว | ไม่มีสิทธิ์: ✕ สีแดง
 * ห้ามแสดงข้อมูลผู้ป่วย/ทะเบียนรถ/วันนัดหมายใดๆ
 */

defineProps<{ ok: boolean }>()
defineEmits<{ rescan: [] }>()
</script>

<template>
  <div
    :class="[
      'tw-rounded-2xl tw-shadow-xl tw-border-4 tw-p-8 tw-flex tw-flex-col tw-items-center tw-gap-4 tw-text-center',
      ok
        ? 'tw-bg-green-50 tw-border-green-500 tw-text-green-700'
        : 'tw-bg-red-50 tw-border-red-500 tw-text-red-700',
    ]"
  >
    <!-- เครื่องหมายผลลัพธ์ ใหญ่และชัดเจน -->
    <div
      :class="[
        'tw-w-32 tw-h-32 sm:tw-w-40 sm:tw-h-40 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-white tw-shadow-lg',
        ok ? 'tw-bg-green-500' : 'tw-bg-red-500',
      ]"
    >
      <span class="tw-text-7xl sm:tw-text-8xl tw-leading-none tw-font-bold select-none">
        {{ ok ? '✓' : '✕' }}
      </span>
    </div>

    <h2
      :class="[
        'tw-text-4xl sm:tw-text-5xl tw-font-bold tw-tracking-wide',
        ok ? 'tw-text-green-700' : 'tw-text-red-700',
      ]"
    >
      {{ ok ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์' }}
    </h2>

    <p class="tw-text-base sm:tw-text-lg tw-font-medium opacity-80">
      {{ ok ? 'อนุญาตให้จอดรถได้' : 'ไม่อนุญาตให้จอดรถ' }}
    </p>

    <!-- ปุ่มกลับไปสแกน/ค้นหาใหม่ -->
    <button
      @click="$emit('rescan')"
      class="tw-mt-2 tw-bg-white hover:tw-bg-slate-50 tw-border tw-border-slate-300 tw-text-slate-700 tw-font-semibold tw-text-base tw-px-6 tw-py-3 tw-rounded-xl tw-shadow-sm tw-transition-colors"
    >
      สแกนอีกครั้ง
    </button>
  </div>
</template>