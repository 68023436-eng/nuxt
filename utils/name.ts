// ============================================================
// Name normalization — ใช้ร่วมกันทั้งหน้าเว็บ (client) และ server
// ให้ทุกฝ่ายใช้อันเดียวกัน เพื่อให้ชื่อที่ clinic กรอกกับชื่อที่
// user login/patient login ตรงกันเสมอ (ตัดคำนำหน้า, ช่องว่างซ้อน)
// ============================================================

// คำนำหน้านามที่ตัดออกถ้าผู้ใช้เผลอกรอกในช่องชื่อจริง
export const TITLE_PREFIXES = ['นางสาว', 'นาง', 'นาย', 'ด.ช.', 'ด.ญ.', 'mr.', 'mrs.', 'ms.', 'miss', 'mr', 'mrs', 'ms']

/** ตัดช่องว่างซ้อน + trim */
export function collapseSpaces(value: string): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

/** ตัดคำนำหน้านามนำหน้าออกจากชื่อ (ครั้งเดียว ถ้าเจอ) */
export function stripTitle(name: string): string {
  let n = String(name ?? '').trim()
  for (const t of TITLE_PREFIXES) {
    // case-insensitive สำหรับอังกฤษ
    const lower = n.toLowerCase()
    const tLower = t.toLowerCase()
    if (lower === tLower) {
      return ''
    }
    if (lower.startsWith(tLower + ' ') || lower.startsWith(tLower + '.')) {
      n = n.slice(t.length).trim()
      return n
    }
  }
  return n
}

/** normalize ชื่อเต็มเดียว: trim, ลบช่องว่างซ้อน, ตัดคำนำหน้า (คงตัวพิมพ์เพื่อใช้แสดงผล) */
export function normalizeName(name: string): string {
  return collapseSpaces(stripTitle(name))
}

/** normalize ชื่อสำหรับเทียบกัน (login/match): ตัดคำนำหน้า + ไม่สนใจตัวพิมพ์ */
export function normalizeNameForMatch(name: string): string {
  return normalizeName(name).toLowerCase()
}

/** normalize เบอร์โทร: ตัด space/ขีด แล้วเก็บเฉพาะตัวเลข */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  return String(phone).replace(/[\s-]/g, '').trim()
}

/**
 * ประกอบชื่อเต็มจาก first_name + last_name (normalize แล้ว)
 * เก็บลงคอลัมน์ patient_name (schema เดิม) ในรูปที่ normalized
 */
export function composeFullName(firstName: string, lastName: string): string {
  const f = normalizeName(firstName)
  const l = normalizeName(lastName)
  return [f, l].filter(Boolean).join(' ').trim()
}