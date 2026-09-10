import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'cancel')

    // ดึง ID จาก URL parameter
    const id = getRouterParam(event, 'id')

    // ตรวจสอบว่า ID เป็นตัวเลขที่ถูกต้อง (ป้องกัน injection)
    const numericId = Number(id)
    if (!id || isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID ไม่ถูกต้อง',
      })
    }

    const client = await serverSupabaseClient(event)

    // ตรวจสอบว่ามี record อยู่จริงก่อนลบ (ใช้ appointment_id ตาม schema จริง)
    const { data: existing, error: findError } = await client
      .from('appointments')
      .select('appointment_id')
      .eq('appointment_id', numericId)
      .single()

    if (findError || !existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'ไม่พบรายการนัดหมายนี้',
      })
    }

    // อัปเดตสถานะเป็น 'completed' (เสร็จสิ้น) เพื่อเก็บไว้ในประวัติและ backup ข้อมูล
    const { error: updateError } = await client
      .from('appointments')
      .update({ status: 'completed' })
      .eq('appointment_id', numericId)

    if (updateError) {
      console.error('Server soft-delete error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถอัปเดตสถานะการลบข้อมูลได้',
      })
    }

    return { success: true, message: 'ลบรายการและย้ายไปประวัติเรียบร้อย (สถานะ: เสร็จสิ้น)' }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})
