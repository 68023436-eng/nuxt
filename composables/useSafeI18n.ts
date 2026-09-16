import { getCurrentInstance } from 'vue'

/**
 * i18n ที่เรียกใช้ได้ทั้งใน component setup และใน plugin/middleware
 * - vue-i18n `useI18n()` ต้องเรียกภายใน setup เท่านั้น
 *   (จะ error "Must be called at the top of a `setup` function" เมื่อ getCurrentInstance() เป็น null เช่นใน plugin)
 * - นอก setup ให้ใช้ global composer จาก nuxt.$i18n แทน
 */
export const useSafeI18n = (): ReturnType<typeof useI18n> => {
  if (getCurrentInstance()) {
    return useI18n()
  }
  return useNuxtApp().$i18n as unknown as ReturnType<typeof useI18n>
}