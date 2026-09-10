import { createError, defineEventHandler, getRequestHost, getRequestIP, getRequestPath, getRequestProtocol, getRequestHeaders, setHeader } from 'h3'

/**
 * Middleware ความปลอดภัยระดับต้น (runs on every request)
 *
 * 1) Security headers (OWASP Secure Headers Project)
 *    - X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
 *      Permissions-Policy, Cross-Origin-Opener/Resource-Policy
 *    - HSTS เฉพาะเมื่อเชื่อมต่อแบบ https เท่านั้น
 *    หมายเหตุ: Content-Security-Policy จัดการแยกที่ server/plugins/csp.ts
 *    (ต้อง nonce ต่อ request จึงต้องสร้างผ่าน render hook)
 *
 * 2) Rate limiting (in-memory sliding window ต่อ IP)
 *    - POST /api/session      (login)     → 10 ครั้ง / 5 นาที กัน brute force
 *    - POST /api/scan/verify  (สแกน QR)   → 30 ครั้ง / นาที กันสแปม
 *    หมายเหตุ: เก็บใน memory ของ instance เดียว — เหมาะกับขนาดโปรเจ็กต์นี้
 *    ถ้าขยายเป็นหลาย instance ต้องย้ายไป Redis/shared store
 *
 * 3) CSRF defense-in-depth (OWASP CSRF Prevention)
 *    - ตรวจ Origin/Referer ว่าเป็น origin เดียวกับ request (same-origin)
 *    - เป็นชั้นเสริมถัดจาก sameSite=lax cookie + รับเฉพาะ JSON body
 *
 * ทั้งหมดเป็น "defense in depth" — สิทธิ์ใช้งานจริงยังบังคับที่ endpoint แต่ละตัว
 */

// ---------------------------------------------------------------------------
// Rate limiting - in-memory sliding window
// ---------------------------------------------------------------------------

const RATE_LIMITS: Record<string, { windowMs: number; limit: number }> = {
  login: { windowMs: 5 * 60 * 1000, limit: 10 },
  verify: { windowMs: 60 * 1000, limit: 30 },
}

const buckets = new Map<string, number[]>()
const MAX_BUCKETS = 10_000

function hitRateLimit(event: any, key: string): { limit: number; remaining: number } | null {
  const rule = RATE_LIMITS[key]
  if (!rule) return null

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const bucketKey = `${key}:${ip}`
  const now = Date.now()

  // ทำความสะอาด bucket เก่าเป็นครั้งคราว (กัน memory leak)
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, times] of buckets) {
      if (now - times[times.length - 1] > 60 * 60 * 1000) buckets.delete(k)
    }
  }

  const times = (buckets.get(bucketKey) || []).filter((t) => now - t < rule.windowMs)

  if (times.length >= rule.limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'มีการร้องขอมากเกินไปในเวลาอันสั้น กรุณาลองใหม่ในภายหลัง',
    })
  }

  times.push(now)
  buckets.set(bucketKey, times)
  return { limit: rule.limit, remaining: rule.limit - times.length }
}

// ---------------------------------------------------------------------------
// CSRF - same-origin check สำหรับ state-changing requests
// ---------------------------------------------------------------------------

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isSameOrigin(event: any): boolean {
  const headers = getRequestHeaders(event)
  const origin = headers.origin
  const referer = headers.referer

  // ไม่มี Origin/Referer → ไม่ใช่ request จาก browser (curl, server-to-server)
  // ปล่อยผ่าน (สิทธิ์จริงยังได้รับการยืนยันด้วย cookie + RBAC)
  if (!origin && !referer) return true

  const proto = getRequestProtocol(event, { xForwardedProto: true })
  const host = getRequestHost(event, { xForwardedHost: true })
  const allowedOrigin = `${proto}://${host}`

  if (origin) return origin === allowedOrigin
  if (referer) return referer.startsWith(`${allowedOrigin}/`) || referer === allowedOrigin
  return false
}

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

export default defineEventHandler((event) => {
  // 1) Header ความปลอดภัยทุก request
  const isHttps = getRequestProtocol(event, { xForwardedProto: true }) === 'https'

  const headers: Record<string, string> = {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=()',
    'X-XSS-Protection': '0',
  }
  if (isHttps) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
  }
  for (const [name, value] of Object.entries(headers)) {
    setHeader(event, name, value)
  }

  // 2) Rate limiting เฉพาะ endpoint ที่อ่อนไหว
  const path = getRequestPath(event)
  const method = (event.method || '').toUpperCase()

  if (method === 'POST') {
    if (path.startsWith('/api/session')) {
      hitRateLimit(event, 'login')
    } else if (path.startsWith('/api/scan/verify')) {
      hitRateLimit(event, 'verify')
    }
  }

  // 3) CSRF same-origin สำหรับการเรียกที่เปลี่ยนสถานะผ่าน /api
  if (path.startsWith('/api/') && STATE_CHANGING_METHODS.has(method)) {
    if (!isSameOrigin(event)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'คำขอนี้มาจากแหล่งที่ไม่ได้รับอนุญาต (CSRF check)',
      })
    }
  }
})