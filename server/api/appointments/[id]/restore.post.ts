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

    let row = rows?.[0]
    if (updateError) {
      // fallback กันกรณี DB ยังไม่ได้สร้าง function — พฤติกรรมเดิม
      console.warn('restore_appointments rpc unavailable, falling back to client-side:', updateError.message)
      const { data: fbRows, error: fbError } = await (client as any)
        .from('appointments')
        .update({ status: 'backup', deleted_at: null })
        .eq('appointment_id', numericId)
        .select('appointment_id')

      if (fbError) {
        console.error('Server restore error:', fbError.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'ไม่สามารถกู้คืนข้อมูลได้',
        })
      }
      row = fbRows?.[0]
    }

    return { success: true, message: 'กู้คืนข้อมูลสำเร็จ (สถานะ: ข้อมูล backup)', data: row || null }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error during restore:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ในการกู้คืนข้อมูล',
    })
  }
})
