import { serverSupabaseClient } from '#supabase/server'

import { unionPermissions } from '~/constants/roles'
import type { AccessRole } from '~/constants/roles'
import { clearAccessSession, isAccessRole, setAccessSession } from '~/server/utils/access'

/**
 * GET /api/session
 * คืนค่า session ปัจจุบัน (ถ้ายังไม่ได้เข้าถึง จะได้ session: null)
 *
 * Reconciliation กับฐานข้อมูลทุกครั้ง (ถ้ามี user_id):
 * - Admin เปลี่ยน/เพิ่ม/ลบ role ให้ → สิทธิ์ใหม่มีผลทันที ไม่ต้อง login ใหม่
 *   (cookie ใหม่จะถูก re-seal ให้ตรงกับ role/roles/ชื่อ/เบอร์ล่าสุดใน DB)
 * - บัญชีถูกปิดใช้งาน / ถูกลบ → ยกเลิก session ทันที (logout อัตโนมัติ)
 */
export default defineEventHandler(async (event) => {
  const session = getAccessSession(event)
  if (!session) {
    return { session: null }
  }

  // --- ตรวจกับ DB เพื่อสะท้อนบทบาทที่เปลี่ยนไป (ถ้ามี user_id) ---
  let current = session
  if (session.user_id) {
    const client = await serverSupabaseClient(event)
    const { data, error } = await client
      .from('hospital_user')
      .select('user_id, full_name, phone_number, role, roles, is_active')
      .eq('user_id', session.user_id)
      .maybeSingle()

    if (!error && data) {
      const row = data as any

      // บัญชีถูกปิดใช้งาน → logout ทันที
      if (row.is_active === false) {
        clearAccessSession(event)
        return { session: null }
      }

      const dbRoles = (
        Array.isArray(row.roles) && row.roles.length
          ? row.roles.filter(isAccessRole)
          : isAccessRole(row.role)
            ? [row.role]
            : []
      ) as AccessRole[]
      const primaryRole = (dbRoles[0] as AccessRole) || (isAccessRole(row.role) ? row.role : session.role)

      const canon = (roles: AccessRole[]) => [...roles].sort().join(',')
      const changed =
        canon(dbRoles) !== canon(current.roles || [current.role]) ||
        primaryRole !== current.role ||
        (row.full_name || null) !== (current.full_name || null) ||
        (row.phone_number || null) !== (current.phone_number || null)

      if (changed) {
        current = {
          full_name: row.full_name || current.full_name,
          phone_number: row.phone_number || current.phone_number || '',
          role: primaryRole,
          roles: dbRoles.length ? dbRoles : [primaryRole],
          user_id: session.user_id,
          iat: Math.floor(Date.now() / 1000),
        }
        // re-seal cookie ให้ตรงกับข้อมูลล่าสุด (สิทธิ์ใหม่มีผลทันที)
        setAccessSession(event, current)
      }
    } else if (!error && !data) {
      // บัญชีถูกลบออกจากระบบแล้ว → ยกเลิก session
      clearAccessSession(event)
      return { session: null }
    }
  }

  const roles = (current.roles || [current.role]).filter(Boolean) as AccessRole[]

  return {
    session: {
      full_name: current.full_name,
      phone_number: current.phone_number,
      role: current.role,
      roles,
      user_id: current.user_id || null,
      permissions: unionPermissions(roles),
      server_today: bangkokToday(),
    },
  }
})