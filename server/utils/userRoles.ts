import type { AccessRole } from '~/constants/roles'
import { ROLE_ORDER } from '~/constants/roles'

/**
 * แปลง role code ที่เก็บในฐานข้อมูล (ทั้งแบบเก่า 'Admin' และแบบใหม่ 'ADMIN')
 * ให้เป็น AccessRole ที่แอปใช้
 */
export function toAccessRole(value: unknown): AccessRole | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (!v) return null
  // รองรับรูปแบบเดิม (mixed-case)
  const direct = [
    'Admin',
    'Clinic_staff',
    'Security_guard',
    'Patient',
  ] as const
  if (direct.includes(v as any)) return v as AccessRole

  const upper = v.toUpperCase().replace(/[\s-]+/g, '_')
  const map: Record<string, AccessRole> = {
    ADMIN: 'Admin',
    ADMINISTRATOR: 'Admin',
    SUPER_ADMIN: 'Admin',
    CLINIC_STAFF: 'Clinic_staff',
    CLINIC: 'Clinic_staff',
    STAFF: 'Clinic_staff',
    SECURITY_GUARD: 'Security_guard',
    SECURITY: 'Security_guard',
    GUARD: 'Security_guard',
    PATIENT: 'Patient',
    PATIENT_USER: 'Patient',
    USER: 'Patient',
  }
  return map[upper] ?? null
}

function dedupe_roles(roles: AccessRole[]): AccessRole[] {
  const seen = new Set<AccessRole>()
  const out: AccessRole[] = []
  for (const r of roles) {
    if (!seen.has(r)) {
      seen.add(r)
      out.push(r)
    }
  }
  return out
}

function orderByRoleOrder(roles: AccessRole[]): AccessRole[] {
  return [...roles].sort((a, b) => {
    const ia = ROLE_ORDER.indexOf(a)
    const ib = ROLE_ORDER.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
}

/**
 * ดึงบทบาทของบัญชีจากฐานข้อมูล (รองรับทั้ง schema เก่า role/roles และ schema ใหม่ user_role)
 * คืนค่าเป็น AccessRole[] ที่เรียง primary ก่อน
 */
export async function fetchAccountRoles(client: any, userId: string): Promise<AccessRole[]> {
  const result: AccessRole[] = []

  // 1) schema เก่า: hospital_user.role / hospital_user.roles
  try {
    const { data, error } = await client
      .from('hospital_user')
      .select('role, roles')
      .eq('user_id', userId)
      .maybeSingle()

    if (!error && data) {
      const raw: unknown[] = []
      if (Array.isArray(data.roles)) raw.push(...data.roles)
      if (data.role) raw.push(data.role)
      const mapped = raw.map(toAccessRole).filter(Boolean) as AccessRole[]
      const dedup = dedupe_roles(mapped)
      if (dedup.length) return dedup
    }
  } catch {
    // column อาจไม่มี → fallback
  }

  // 2) schema ใหม่: user_role.role_code
  try {
    const { data, error } = await client
      .from('user_role')
      .select('role_code, is_primary')
      .eq('user_id', userId)

    if (!error && Array.isArray(data) && data.length) {
      const entries = data
        .map((r: any) => ({
          role: toAccessRole(r?.role_code),
          isPrimary: r?.is_primary === true,
        }))
        .filter((e: any) => e.role)

      const primary = entries.find((e: any) => e.isPrimary)?.role
      const all = dedupe_roles(entries.map((e: any) => e.role as AccessRole))
      if (primary && all.includes(primary)) {
        return [primary, ...all.filter((r) => r !== primary)]
      }
      return orderByRoleOrder(all)
    }
  } catch {
    // ignore
  }

  return result
}