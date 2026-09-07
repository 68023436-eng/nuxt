
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
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
