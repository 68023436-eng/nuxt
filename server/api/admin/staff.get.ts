import { serverSupabaseClient } from '#supabase/server'
import { STAFF_ROLES } from '~/constants/roles'
import type { AccessRole } from '~/constants/roles'
import { fetchAccountRoles } from '~/server/utils/userRoles'

/**
 * GET /api/admin/staff
 * ดึงรายชื่อเจ้าหน้าที่ทั้งหมด (Admin / Clinic_staff / Security_guard)
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'manage')

    const client = await serverSupabaseClient(event)

    // ดึง user_id ของเจ้าหน้าที่จาก user_role
    const { data: roleRows, error: roleErr } = await client
      .from('user_role')
      .select('user_id')

    if (roleErr) {
      console.error('List staff error:', roleErr.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงรายชื่อเจ้าหน้าที่ได้' })
    }

    // กรองเฉพาะ user ที่มีบทบาท staff (ตรวจสอบผ่าน fetchAccountRoles)
    const uniqueIds = [...new Set((roleRows as any[] || []).map((r) => r.user_id).filter(Boolean))]
    const staffIds: string[] = []
    const rolesByUser = new Map<string, AccessRole[]>()
    for (const uid of uniqueIds) {
      const roles = await fetchAccountRoles(client, String(uid))
      if (roles.some((r) => (STAFF_ROLES as AccessRole[]).includes(r))) {
        staffIds.push(String(uid))
        rolesByUser.set(String(uid), roles)
      }
    }

    if (!staffIds.length) return []

    const { data, error } = await client
      .from('hospital_user')
      .select('user_id, full_name, phone_number, email, is_active')
      .in('user_id', staffIds)

    if (error) {
      console.error('List staff error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงรายชื่อเจ้าหน้าที่ได้' })
    }

    type StaffRow = { user_id: string; full_name: string; role: AccessRole; roles: AccessRole[]; phone_number: string | null; email: string | null; is_active: boolean }
    const rows = (data as any[] || []).map((p) => {
      const roles = rolesByUser.get(String(p.user_id)) || []
      const primary = (roles[0] as AccessRole) || 'Clinic_staff'
      return {
        user_id: p.user_id,
        full_name: p.full_name,
        role: primary,
        roles,
        phone_number: p.phone_number || null,
        email: p.email || null,
        is_active: p.is_active !== false,
      } as StaffRow
    })

    return rows.sort((a, b) => {
      const ra = STAFF_ROLES.indexOf(a.role) >= 0 ? STAFF_ROLES.indexOf(a.role) : 99
      const rb = STAFF_ROLES.indexOf(b.role) >= 0 ? STAFF_ROLES.indexOf(b.role) : 99
      if (ra !== rb) return ra - rb
      return a.full_name.localeCompare(b.full_name)
    })
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})