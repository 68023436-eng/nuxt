import { getCookie } from 'h3'

/**
 * Middleware access (global)
 * ทุกหน้าต้องมี session (เข้าถึง/เข้าสู่ระบบ) ก่อน — ไม่มีให้ redirect ไป /access
 *
 * หมายเหตุ: ตรวจสอบลึก (signature) จริงอยู่ที่ server (data API + /api/session)
 * ที่นี่ตรวจแค่ระดับหน้าจอเพื่อพาไปหน้า login + จัดเส้นทางตามบทบาท
 */

// อ่าน role จาก payload ของ cookie (ตรวจเฉพาะ UI-level เท่านั้น; สิทธิ์จริงบังคับที่ server API)
function decodeRoleFromCookie(token: string | undefined): string | null {
  if (!token || typeof token !== 'string') return null
  const body = token.split('.')[0]
  if (!body) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    return typeof parsed?.role === 'string' ? parsed.role : null
  } catch {
    return null
  }
}

// หน้าทีี่ รปภ. ห้ามเห็นข้อมูลนัดหมาย/ข้อมูลผู้ป่วยทั้งหมด
const GUARD_RESTRICTED_PREFIXES = ['/appointments', '/patient-form', '/admin']

export default defineNuxtRouteMiddleware(async (to) => {
  // หน้าเข้าถึงระบบ ไม่ต้องตรวจ
  if (to.path === '/access') return

  // ฝั่ง server (SSR): อ่าน cookie ตรงๆ ไม่ต้องออก HTTP request
  const event = useRequestEvent()
  let hasSession = false
  let role: string | null = null

  if (event) {
    const token = getCookie(event, 'hc_access')
    hasSession = typeof token === 'string' && token.includes('.')
    role = decodeRoleFromCookie(token)
  } else {
    try {
      const res = await $fetch<{ session: any }>('/api/session')
      hasSession = !!res?.session
      role = res?.session?.role || null
    } catch {
      hasSession = false
    }
  }

  if (!hasSession) {
    return navigateTo('/access')
  }

  // รปภ. ดูได้เฉพาะหน้า ตรวจสอบ / ประวัติ(ของตัวเอง) — ไม่อนุญาตให้เปิดหน้าข้อมูลผู้ป่วย
  if (role === 'Security_guard') {
    const restricted = GUARD_RESTRICTED_PREFIXES.some((p) => to.path.startsWith(p))
    const isMain = to.path === '/'
    if (restricted || isMain) {
      return navigateTo('/verify')
    }
  }

  // ผู้ที่ไม่ใช่ รปภ./Admin ห้ามเข้าหน้าตรวจสอบ QR (even direct URL /verify)
  // ระดับหน้า — แต่การป้องกันจริงอยู่ที่ server API (scan/* requireAnyRole)
  if (to.path === '/verify' && role && role !== 'Security_guard' && role !== 'Admin') {
    return navigateTo('/appointments')
  }
})