
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
    redirect: false
  },

css: [
    '~/assets/css/tailwind.css'
  ],

  runtimeConfig: {
    // ใช้สำหรับเซ็นต์ cookie ของ session (ควรตั้ง SESSION_SECRET ใน .env ใน production)
    sessionSecret: process.env.SESSION_SECRET || 'hc-dev-session-secret',
    // ใช้สำหรับตรวจสอบสิทธิ์ cron ลบข้อมูลที่หมดอายุ (ตั้ง CRON_SECRET ใน .env)
    cronSecret: process.env.CRON_SECRET || 'hc-dev-cron-secret'
  }
})
