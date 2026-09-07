import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/admin/staff
 * ดึงรายชื่อเจ้าหน้าที่ทั้งหมด (Admin / Clinic_staff / Security_guard)
 * - สงวนสิทธิ์เฉพาะ Admin เท่านั้น
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'manage')

    const client = await serverSupabaseClient(event)

    const { data, error } = await client
      .from('hospital_user')
      .select('user_id, full_name, role, phone_number, email, is_active')
      .in('role', ['Admin', 'Clinic_staff', 'Security_guard'])
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
