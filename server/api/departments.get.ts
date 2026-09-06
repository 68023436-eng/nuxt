import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/departments
 * ดึงรายการแผนกจาก Supabase (hospital_dept) สำหรับหน้าเลือกแผนกในแบบฟอร์ม
 */
export default defineEventHandler(async (event) => {
  try {
    requireSession(event)

    const client = await serverSupabaseClient(event)

    const { data, error } = await client
      .from('hospital_dept')
      .select('dept_id, dept_code, dept_name_th, dept_name_en')
      .order('dept_id', { ascending: true })

    if (error) {
      console.error('Server fetch departments error:', error.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถดึงข้อมูลแผนกได้',
      })
    }

    return data || []
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})