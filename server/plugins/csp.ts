import { setHeader } from 'h3'
import { randomBytes } from 'node:crypto'

/**
 * Content-Security-Policy พร้อม nonce ต่อ request
 *
 * Nuxt 3.21 ยังไม่มี routeRules.csp (ไม่ inject nonce ให้ inline script
 * ของ window.__NUXT__ config) จึงจัดการเองผ่าน Nitro render:html hook:
 *
 *   1) สร้าง nonce ใหม่ทุกรอบ request
 *   2) ใส่ nonce="" ให้ inline <script>/<style> ใน HTML ที่ SSR ออกมา
 *   3) ตอบกลับด้วย header Content-Security-Policy ซึ่งอนุญาต nonce นั้นด้วย
 *
 * ด้วยวิธีนี้ script-src 'self' ยังคงเข้มงวด (ห้าม inline script ทั่วไป/XSS)
 * แต่ inline script ที่ Nuxt จำเป็นต้องใช้ (runtime config) ยังทำงานได้
 *
 * เปิดเฉพาะ production (NODE_ENV=production) — ถ้าเปิดใน dev จะไปรบกวน
 * HMR/inline script ของ Vite devtools
 */

const INLINE_TAG_RE = /<(script|style)(?=[^>]*>)(?![^>]*\bsrc=)(?![^>]*\bnonce=)/g

export default defineNitroPlugin((nitroApp) => {
  const nonces = new WeakMap<object, string>()

  function nonceFor(event: any): string {
    const key = event?.node?.req || event
    let nonce = nonces.get(key)
    if (!nonce) {
      nonce = randomBytes(16).toString('base64url')
      nonces.set(key, nonce)
    }
    return nonce
  }

  function buildCsp(nonce: string): string {
    const config = useRuntimeConfig()
    const supabaseUrl = config?.public?.supabase?.url
    const connectSrc = typeof supabaseUrl === 'string' && supabaseUrl
      ? `'self' ${supabaseUrl}`
      : `'self' https:`
    return [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}'`,
      `script-src-attr 'none'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data:`,
      `font-src 'self' data:`,
      `connect-src ${connectSrc}`,
      `object-src 'none'`,
      `frame-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `upgrade-insecure-requests`,
    ].join('; ')
  }

  function injectNonce(htmlChunk: unknown, nonce: string): unknown {
    if (typeof htmlChunk !== 'string') return htmlChunk
    return htmlChunk.replace(INLINE_TAG_RE, `<$1 nonce="${nonce}"`)
  }

  function injectNonceIntoChunks(chunks: unknown[], nonce: string): unknown[] {
    if (!Array.isArray(chunks)) return chunks
    return chunks.map((chunk) => injectNonce(chunk, nonce))
  }

  nitroApp.hooks.hook('request', (event) => {
    nonceFor(event)
  })

  nitroApp.hooks.hook('render:html', (html: any, { event }: { event: any }) => {
    if ((process.env.NODE_ENV || 'development') !== 'production') return

    const nonce = nonceFor(event)

    html.head = injectNonceIntoChunks(html.head, nonce)
    html.bodyPrepend = injectNonceIntoChunks(html.bodyPrepend, nonce)
    html.body = injectNonceIntoChunks(html.body, nonce)
    html.bodyAppend = injectNonceIntoChunks(html.bodyAppend, nonce)

    setHeader(event, 'Content-Security-Policy', buildCsp(nonce))
  })
})