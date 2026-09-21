import { getCookie } from 'h3'
import { ROLE_PERMISSIONS, unionPermissions } from '~/constants/roles'
import type { AccessRole } from '~/constants/roles'

/**
 * เติม session ลงใน SSR state ก่อนเรนเดอร์หน้า
 *
 * ปัญหาที่แก้: ตอน SSR จะมีตัวแปร session ค่า null (ไม่รู้ว่าใคร login) แต่
 * ฝั่ง client session จะถูกโหลดจาก /api/session ตอน hydration → HTML ต่างกัน
 * เกิด "Hydration mismatch" → Vue จัดการ mismatch โดย rerender RouterView
 * นอก render context → บางเครื่อง (iOS/Safari) fail ที่
 * `instance.__vrv_devtools = info` (error 500, "null is not an object")
 *
 * วิธีแก้: อ่าน + ตรวจสอบลายเซ็น cookie (hc_access) บน server แล้วเซ็ต useState
 * เดียวกับ useSession() → Nuxt serialize ลง payload → client hydrate จากค่าเดียวกัน
 */
export default defineNuxtPlugin(async () => {
  const event = useRequestEvent()
  if (!event) return

  const session = await unsealAccessSession(getCookie(event, 'hc_access'))
  if (!session) return

  const roles = (session.roles || [session.role]).filter(
    (r: AccessRole) => ROLE_KEYS.includes(r)
  )

  useState<any>('hc-session', () => null).value = {
    full_name: session.full_name,
    phone_number: session.phone_number,
    role: session.role,
    roles,
    user_id: session.user_id || null,
    permissions: unionPermissions(roles),
  }
})

// ============================================================
// unseal (สำเนาเรียบง่ายจาก server/utils/access.ts)
// — เขียนซ้ำที่นี่ เพราะ plugin ฝั่ง app import ไฟล์จาก ~/server/utils ไม่ได้
// ============================================================

const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 8 // 8 ชั่วโมง สอดคล้องกับ server utils
const IAT_SKEW_SECONDS = 5 * 60

const ROLE_KEYS = Object.keys(ROLE_PERMISSIONS)

function getSecret(): string {
  const config = useRuntimeConfig()
  const secret = config.sessionSecret as string
  if (!secret) {
    return ''
  }
  return secret
}

async function sign(body: string, secret: string): Promise<string> {
  const { createHmac } = await import('node:crypto')
  return createHmac('sha256', secret).update(body).digest('hex')
}

async function timingSafeEqualStr(a: string, b: string): Promise<boolean> {
  if (Buffer.from(a).length !== Buffer.from(b).length) return false
  const { timingSafeEqual } = await import('node:crypto')
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

async function unsealAccessSession(token: string | undefined | null, maxAgeSeconds = ACCESS_COOKIE_MAX_AGE) {
  if (!token) return null
  const secret = getSecret()
  if (!secret) return null

  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [body, sig] = parts
  const expected = await sign(body, secret)
  if (!(await timingSafeEqualStr(expected, sig))) return null

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!parsed || typeof parsed.role !== 'string' || !ROLE_KEYS.includes(parsed.role)) return null

    const roles = Array.isArray(parsed.roles)
      ? parsed.roles.filter((r: unknown) => typeof r === 'string' && ROLE_KEYS.includes(r))
      : [parsed.role]

    if (typeof parsed.iat !== 'number' || !Number.isFinite(parsed.iat)) return null

    const now = Math.floor(Date.now() / 1000)
    if (now - parsed.iat > maxAgeSeconds) return null
    if (parsed.iat > now + IAT_SKEW_SECONDS) return null

    return {
      full_name: parsed.full_name as string,
      phone_number: parsed.phone_number as string,
      role: parsed.role as AccessRole,
      roles,
      user_id: parsed.user_id as string | undefined,
    }
  } catch {
    return null
  }
}