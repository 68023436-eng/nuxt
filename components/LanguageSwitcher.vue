<template>
  <div
    role="group"
    :aria-label="$t('languageSwitcher.label')"
    class="tw-inline-flex tw-items-center tw-gap-1 tw-p-1 tw-rounded-xl tw-bg-slate-100/90 tw-border tw-border-slate-200/80 tw-shadow-inner tw-select-none"
  >
    <button
      v-for="l in locales"
      :key="l.code"
      type="button"
      :aria-pressed="isActive(l.code)"
      @click="switchTo(l.code)"
      :class="[
        'tw-inline-flex tw-items-center tw-justify-center tw-px-3 sm:tw-px-2.5 tw-py-1.5 sm:tw-py-1 tw-rounded-lg tw-text-xs tw-font-semibold tw-transition-all tw-duration-150 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400 active:tw-scale-95',
        isActive(l.code)
          ? 'tw-bg-emerald-600 tw-text-white tw-shadow-sm'
          : 'tw-text-slate-600 hover:tw-bg-white hover:tw-text-slate-900'
      ]"
    >
      <span aria-hidden="true" class="tw-mr-1.5 sm:tw-mr-1 tw-text-sm sm:tw-text-xs">{{ l.flag }}</span>
      <span>{{ l.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * LanguageSwitcher
 * ปุ่มเปลี่ยนภาษา — รายการภาษามาจาก i18n config (th / en / my...)
 * สลับทันทีและจำค่าใน cookie (hc_locale)
 */
const { locale, setLocale, locales } = useI18n()

const isActive = (code: string) => locale.value === code

const switchTo = async (code: string) => {
  if (locale.value === code) return
  await setLocale(code as 'th' | 'en')
}
</script>