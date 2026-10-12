import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'restore')

    // ดึง ID จาก URL parameter
    const id = getRouterParam(event, 'id')

    // ตรวจสอบว่า ID เป็นตัวเลขที่ถูกต้อง
    const numericId = Number(id)
    if (!id || isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID ไม่ถูกต้อง',
      })
    }

    const client = await serverSupabaseClient(event)

    // ตรวจสอบว่ามี record อยู่จริงก่อนกู้คืน
    const { data: existing, error: findError } = await client
      .from('appointments')
      .select('appointment_id, status, deleted_at')
      .eq('appointment_id', numericId)
      .single()

    if (findError || !existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'ไม่พบรายการนัดหมายนี้',
      })
    }

    // กู้คืนผ่าน stored function (set status='backup' + ล้าง deleted_at)
    const { data: rows, error: updateError } = await (client as any).rpc(
      'restore_appointments',
      { p_ids: [numericId] },
    )

    if (updateError) {
      console.error('Server restore error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถกู้คืนข้อมูลได้',
      })
    }

    return { success: true, message: 'กู้คืนข้อมูลสำเร็จ (สถานะ: ข้อมูล backup)', data: rows?.[0] || null }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error during restore:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ในการกู้คืนข้อมูล',
    })
  }
})
