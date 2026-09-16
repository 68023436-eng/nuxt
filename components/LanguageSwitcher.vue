<template>
  <div
    role="group"
    :aria-label="$t('languageSwitcher.label')"
    class="tw-inline-flex tw-items-center tw-gap-1 tw-p-1 tw-rounded-lg tw-bg-slate-100 tw-border tw-border-slate-200"
  >
    <button
      v-for="l in locales"
      :key="l.code"
      type="button"
      :aria-pressed="isActive(l.code)"
      @click="switchTo(l.code)"
      class="tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs tw-font-medium tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400"
      :class="
        isActive(l.code)
          ? 'tw-bg-emerald-600 tw-text-white tw-shadow-sm'
          : 'tw-text-gray-600 hover:tw-bg-white hover:tw-text-gray-900'
      "
    >
      <span aria-hidden="true" class="tw-mr-1">{{ l.flag }}</span>{{ l.name }}
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