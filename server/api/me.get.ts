import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/me
 * ดึงข้อมูลบัญชีของตัวเอง (สำหรับหน้าจอแก้ไขโปรไฟล์)
 * - ใครก็ได้ที่ login เข้าใช้งาน
 */
export default defineEventHandler(async (event) => {
  try {
    const session = requireSession(event)
    if (!session?.user_id) {
      throw createError({ statusCode: 401, statusMessage: 'ไม่พบข้อมูลบัญชี กรุณาเข้าสู่ระบบใหม่' })
    }

    const client = await serverSupabaseClient(event)
    const { data, error } = await client
      .from('hospital_user')
      .select('user_id, full_name, phone_number, email, role, roles, is_active')
      .eq('user_id', session.user_id)
      .maybeSingle()

    if (error) {
      console.error('Get me error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลบัญชีได้' })
    }
    if (!data) {
      throw createError({ statusCode: 404, statusMessage: 'ไม่พบบัญชีของคุณในระบบ' })
    }

    return data
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})