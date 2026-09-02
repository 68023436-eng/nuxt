// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],
  css: [
    '~/assets/css/tailwind.css'
  ],
  supabase: {
    // ปิดการบังคับ Login อัตโนมัติในทุกหน้า (ให้เปิดเข้าหน้าสแกนได้)
    redirect: false
  }
})