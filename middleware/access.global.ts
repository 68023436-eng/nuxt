import { getCookie } from 'h3'

/**
 * Middleware access (global)
 * ทุกหน้าต้องมี session (เข้าถึง/เข้าสู่ระบบ) ก่อน — ไม่มีให้ redirect ไป /access
 *
 * หมายเหตุ: ตรวจสอบลึก (signature) จริงอยู่ที่ server (data API + /api/session)
 * ที่นี่ตรวจแค่ระดับหน้าจอเพื่อพาไปหน้า login
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // หน้าเข้าถึงระบบ ไม่ต้องตรวจ
  if (to.path === '/access') return

  // ฝั่ง server (SSR): อ่าน cookie ตรงๆ ไม่ต้องออก HTTP request
  const event = useRequestEvent()
  let hasSession = false

  if (event) {
    const token = getCookie(event, 'hc_access')
    hasSession = typeof token === 'string' && token.includes('.')
  } else {
    try {
      const res = await $fetch<{ session: any }>('/api/session')
      hasSession = !!res?.session
    } catch {
      hasSession = false
    }
  }

  if (!hasSession) {
    return navigateTo('/access')
  }
})