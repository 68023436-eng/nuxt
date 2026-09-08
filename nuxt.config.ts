
// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path'

/**
 * ป้องกันบั๊ก dev restart บน Windows (Nuxt + @nuxtjs/tailwindcss):
 * เมื่อ dev server auto-restart หลายรอบ CSS entry อาจถูก register ซ้ำ
 * (absolute path ตัวเดียวกันหลายบรรทัด) → SSR พยายาม ssrLoadModule('C:/...')
 * → error protocol 'c:' (500 ทั้งหน้า) — ตรงนี้ dedupe ให้เหลือ entry เดียวเสมอ
 */
function dedupeCssEntries(css: any[]): any[] {
  const seen = new Set<string>()
  const norm = (src: unknown): string | null => {
    if (typeof src !== 'string') return null
    let p = src
    if (p.startsWith('~/') || p.startsWith('@/')) p = resolve(process.cwd(), p.slice(2))
    return p.split('\\').join('/').toLowerCase()
  }
  return css.filter((item) => {
    const key = norm(typeof item === 'string' ? item : item?.src)
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // ปิด app manifest (Nuxt 3.21 regression: dev pre-transform ไม่ resolve `#app-manifest` -
  // ดู nuxt/nuxt#33606, #34164). โปรเจ็กต์นี้ไม่ได้ใช้อัปเดตแอปอัตโนมัติ/route rules manifest
  experimental: {
    appManifest: false
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    {
      setup(nuxt) {
        nuxt.hook('modules:done', () => {
          nuxt.options.css = dedupeCssEntries(nuxt.options.css || [])
        })
      },
    },
  ],

  supabase: {
    redirect: false,
    // เราไม่ได้ใช้ Database types แบบ generate ของ Supabase (เรียกผ่าน PostgREST ของเราเอง)
    // ปิด default `~/types/database.types.ts` ที่ module อ้างถึงแต่ไฟล์ไม่มี -> ตัด warning
    types: false
  },

css: [
    '~/assets/css/tailwind.css'
  ],

  runtimeConfig: {
    // ใช้สำหรับเซ็นต์ cookie ของ session — ต้องตั้ง SESSION_SECRET ใน .env
    // (ไม่มีค่า default อีกต่อไป: ถ้าไม่ตั้ง server จะปฏิเสธการเข้า/ออกระบบ แทนที่จะใช้ค่าที่คาดเดาได้)
    sessionSecret: process.env.SESSION_SECRET || '',
    // ใช้สำหรับตรวจสอบสิทธิ์ cron ลบข้อมูลที่หมดอายุ — ต้องตั้ง CRON_SECRET ใน .env
    cronSecret: process.env.CRON_SECRET || ''
  }
})
