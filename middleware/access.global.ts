import { getCookie } from 'h3'

/**
 * Middleware access (global)
 * ทุกหน้าต้องมี session (เข้าถึง/เข้าสู่ระบบ) ก่อน — ไม่มีให้ redirect ไป /access
 *
 * หมายเหตุ: ตรวจสอบลึก (signature) จริงอยู่ที่ server (data API + /api/session)
 * ที่นี่ตรวจแค่ระดับหน้าจอเพื่อพาไปหน้า login + จัดเส้นทางตามบทบาท
 *
 * รองรับ 1 user = หลาย role (roles[]) — สิทธิ์รวมทุกบทบาทที่บัญชีมี
 */

// อ่าน role/roles จาก payload ของ cookie (ตรวจเฉพาะ UI-level เท่านั้น; สิทธิ์จริงบังคับที่ server API)
function decodeRolesFromPayload(token: string | undefined): { role: string | null; roles: string[] | null } {
  if (!token || typeof token !== 'string') return { role: null, roles: null }
  const body = token.split('.')[0]
  if (!body) return { role: null, roles: null }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    const role = typeof parsed?.role === 'string' ? parsed.role : null
    const roles = Array.isArray(parsed?.roles) && parsed.roles.length
      ? parsed.roles.filter((r: unknown) => typeof r === 'string')
      : (role ? [role] : [])
    return { role, roles }
  } catch {
    return { role: null, roles: null }
  }
}

const hasRole = (roles: string[] | null, r: string) => !!roles?.includes(r)

// หน้าทีี่ รปภ. (ที่ไม่ได้เป็น Admin) ห้ามเห็นข้อมูลนัดหมาย/ข้อมูลผู้ป่วยทั้งหมด
const GUARD_RESTRICTED_PREFIXES = ['/appointments', '/patient-form', '/admin']

// หน้าเฉพาะเจ้าหน้าที่ — ผู้ป่วย (Patient) ดูได้เฉพาะใบนัดของตัวเอง ไม่เข้าแบบฟอร์ม/จัดการ
const STAFF_ONLY_PREFIXES = ['/patient-form', '/admin']

export default defineNuxtRouteMiddleware(async (to) => {
  // หน้าเข้าถึงระบบ ไม่ต้องตรวจ
  if (to.path === '/access') return

  // ฝั่ง server (SSR): อ่าน cookie ตรงๆ ไม่ต้องออก HTTP request
  const event = useRequestEvent()
  let hasSession = false
  let role: string | null = null
  let roles: string[] | null = null

  if (event) {
    const token = getCookie(event, 'hc_access')
    hasSession = typeof token === 'string' && token.includes('.')
    const decoded = decodeRolesFromPayload(token)
    role = decoded.role
    roles = decoded.roles
  } else {
    try {
      const res = await $fetch<{ session: any }>('/api/session')
      hasSession = !!res?.session
      role = res?.session?.role || null
      roles = Array.isArray(res?.session?.roles) && res.session.roles.length
        ? res.session.roles
        : (role ? [role] : null)
      // ซิงก์ session ล่าสุด (หลัง reconciled กับ DB) ลง state —
      // ทำให้เมนู/การ์ดหน้าเรนเดอร์ใหม่จากบทบาทปัจจุบันที่ Admin เปลี่ยนให้
      useState<any>('hc-session').value = res?.session || null
    } catch {
      hasSession = false
    }
  }

  if (!hasSession) {
    return navigateTo('/access')
  }

  const isPatientOnly = roles?.length === 1 && roles[0] === 'Patient'
  // รปภ. เฉพาะ (ไม่ใช่ Admin/Clinic_staff) เท่านั้นที่ถูกล็อกหน้าข้อมูลผู้ป่วย
  const isGuardRestricted = !!(roles && hasRole(roles, 'Security_guard') && !hasRole(roles, 'Admin') && !hasRole(roles, 'Clinic_staff'))

  // ผู้ป่วย (Patient) เท่านั้น: ห้ามเข้าแบบฟอร์ม/หน้า admin (incl. direct URL)
  if (isPatientOnly) {
    const staffOnly = STAFF_ONLY_PREFIXES.some((p) => to.path.startsWith(p))
    const isMain = to.path === '/'
    if (staffOnly || isMain) {
      return navigateTo('/appointments')
    }
  }

  // รปภ. (ที่ไม่ใช่ Admin/Clinic_staff) ดูได้เฉพาะหน้า ตรวจสอบ / ประวัติ(ของตัวเอง)
  // — ไม่อนุญาตให้เปิดหน้าข้อมูลผู้ป่วย
  if (isGuardRestricted) {
    const restricted = GUARD_RESTRICTED_PREFIXES.some((p) => to.path.startsWith(p))
    const isMain = to.path === '/'
    if (restricted || isMain) {
      return navigateTo('/verify')
    }
  }

  // ผู้ที่ไม่มีบทบาท รปภ./Admin ห้ามเข้าหน้าตรวจสอบ QR (even direct URL /verify)
  // ระดับหน้า — แต่การป้องกันจริงอยู่ที่ server API (scan/* requireAnyRole)
  if (to.path === '/verify' && roles && !hasRole(roles, 'Security_guard') && !hasRole(roles, 'Admin')) {
    return navigateTo('/appointments')
  }
})