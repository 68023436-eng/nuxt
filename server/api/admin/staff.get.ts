import { serverSupabaseClient } from '#supabase/server'
import { STAFF_ROLES } from '~/constants/roles'

/**
 * GET /api/admin/staff
 * ดึงรายชื่อเจ้าหน้าที่ทั้งหมด (Admin / Clinic_staff / Security_guard)
 * - สงวนสิทธิ์เฉพาะ Admin เท่านั้น (manage)
 * - items มาพร้อม roles[] (ทุกบทบาทของบัญชี) — 1 user มีได้หลาย role
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'manage')

    const client = await serverSupabaseClient(event)

    const { data, error } = await client
      .from('hospital_user')
      .select('user_id, full_name, role, roles, phone_number, email, is_active')
      .in('role', STAFF_ROLES)
      .order('role', { ascending: true })
      .order('full_name', { ascending: true })

    if (error) {
      console.error('List staff error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงรายชื่อเจ้าหน้าที่ได้' })
    }

    return data || []
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})
