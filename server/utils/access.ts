import { createHmac, timingSafeEqual } from 'node:crypto'
import { ROLE_PERMISSIONS, ROLE_LABELS } from '~/constants/roles'
import type { AccessRole, AccessPermission } from '~/constants/roles'

export type { AccessRole, AccessPermission }

// ============================================================
// ระบบสิทธิ์เข้าถึง (Access / Session-based RBAC)
// - role อ้างอิงจากตาราง hospital_user ใน Supabase
// - session เก็บใน cookie httpOnly ที่เซ็นต์ด้วย HMAC-SHA256
// ============================================================

export const ACCESS_COOKIE = 'hc_access'

export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 8 // 8 ชั่วโมง

export interface AccessSession {
  full_name: string
  phone_number: string
  role: AccessRole
  iat: number
}

// ความคลาดเคลื่อนของนาฬิกา (clock skew) ที่ยอมรับได้ +-5 นาที
const IAT_SKEW_SECONDS = 5 * 60

// สิทธิ์ตาม role กำหนดไว้ใน constants/roles.ts (ROLE_PERMISSIONS, ROLE_LABELS)

const ALL_ROLES = Object.keys(ROLE_PERMISSIONS) as AccessRole[]

function getSecret(): string {
  const config = useRuntimeConfig()
  const secret = config.sessionSecret as string
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SESSION_SECRET ไม่ได้ตั้งค่าใน .env — ปิดใช้ระบบ session เพื่อความปลอดภัย',
    })
  }
  return secret
}

function sign(body: string): string {
  return createHmac('sha256', getSecret()).update(body).digest('hex')
}

const timingSafeEqualStr = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function isAccessRole(value: unknown): value is AccessRole {
  return typeof value === 'string' && (ALL_ROLES as string[]).includes(value)
}

export function sealAccessSession(session: AccessSession): string {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function unsealAccessSession(token: string | undefined | null, maxAgeSeconds = ACCESS_COOKIE_MAX_AGE): AccessSession | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [body, sig] = parts
  const expected = sign(body)
  if (!timingSafeEqualStr(expected, sig)) return null

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AccessSession
    if (!parsed || typeof parsed.role !== 'string' || !isAccessRole(parsed.role)) return null

    // validate iat เลขวินาที (epoch) — เหมือนเวลาที่ใช้ seal
    if (typeof parsed.iat !== 'number' || !Number.isFinite(parsed.iat)) return null

    const now = Math.floor(Date.now() / 1000)
    // หมดอายุแล้วฝั่ง server (cookie maxAge ใช้บังคับที่ browser เท่านั้น —
    // ต้องตรวจที่ server ด้วยเพื่อกันใช้ token ที่ขโมยมาเกินอายุจริง)
    if (now - parsed.iat > maxAgeSeconds) return null
    // iat ในอนาคตเกินกว่าความคลาดเคลื่อนของนาฬิกา → ไม่น่าเชื่อถือ
    if (parsed.iat > now + IAT_SKEW_SECONDS) return null

    return parsed
  } catch {
    return null
  }
}

export function getAccessSession(event: any): AccessSession | null {
  return unsealAccessSession(getCookie(event, ACCESS_COOKIE))
}

export function setAccessSession(event: any, session: AccessSession): void {
  setCookie(event, ACCESS_COOKIE, sealAccessSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: getRequestProtocol(event) === 'https',
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE,
  })
}

export function clearAccessSession(event: any): void {
  deleteCookie(event, ACCESS_COOKIE, { path: '/' })
}

export function hasPermission(session: AccessSession | null, perm: AccessPermission): boolean {
  if (!session) return false
  return ROLE_PERMISSIONS[session.role]?.includes(perm) ?? false
}

// ต้องการ session (เข้าใช้งานแล้ว) — ไม่มี → 401
export function requireSession(event: any): AccessSession {
  const session = getAccessSession(event)
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: 'กรุณาเข้าสู่ระบบเพื่อใช้งาน',
    })
  }
  return session
}

// ต้องการ session ที่มี role ใด role หนึ่งในที่กำหนด — ไม่ใช่ → 403
export function requireAnyRole(event: any, roles: AccessRole[]): AccessSession {
  const session = requireSession(event)
  if (!roles.includes(session.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: `บทบาทของคุณ (${session.role}) ไม่มีสิทธิ์ใช้ฟังก์ชันนี้`,
    })
  }
  return session
}

// ต้องการสิทธิ์เฉพาะ — ไม่มี → 403
export function requirePermission(event: any, perm: AccessPermission): AccessSession {
  const session = requireSession(event)
  if (!hasPermission(session, perm)) {
    let label: string = perm
    if (perm === 'create') label = 'การกรอกข้อมูล/สร้างใบนัด'
    else if (perm === 'cancel') label = 'การยกเลิกนัดหมาย'
    else if (perm === 'restore') label = 'การกู้คืนข้อมูล'
    else if (perm === 'view') label = 'การดูข้อมูลนัดหมาย'

    throw createError({
      statusCode: 403,
      statusMessage: `บทบาทของคุณไม่มีสิทธิ์สำหรับ${label} (${session.role})`,
    })
  }
  return session
}