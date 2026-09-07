import { serverSupabaseClient } from '#supabase/server'

/**
 * POST /api/appointments/restore-batch
 * กู้คืนข้อมูลหลายรายการพร้อมกัน (จากหน้าประวัติ)
 * body: { ids: number[] }
 * - ใช้สำหรับ "กู้คืนที่เลือก" และ "กู้คืนทั้งหมด"
 * - กู้คืน = set status='backup' + ล้าง deleted_at (หยุดการนับลบถาวรแบบเดียวกับกู้คืนรายเดียว)
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'restore')

    const body = await readBody(event)
    const ids = body?.ids

    // ตรวจสอบว่า ids เป็น array ของตัวเลขที่ถูกต้อง
    if (!Array.isArray(ids) || ids.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'กรุณาเลือกรายการที่จะกู้คืนก่อน',
      })
    }

    const numericIds = ids.map((id: any) => Number(id))
    const valid = numericIds.every((id: number) => Number.isInteger(id) && id > 0)
    if (!valid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID ไม่ถูกต้อง',
      })
    }

    const client = await serverSupabaseClient(event)

    // กู้คืนทุก id พร้อมกันใน query เดียว (set status='backup' + ล้าง deleted_at)
    const { data: updated, error: updateError } = await client
      .from('appointments')
      .update({ status: 'backup', deleted_at: null })
      .in('appointment_id', numericIds)
      .select('appointment_id')

    if (updateError) {
      console.error('Server batch restore error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถกู้คืนข้อมูลได้',
      })
    }

    return {
      success: true,
      count: updated?.length || 0,
      data: updated || [],
      message: `กู้คืนข้อมูลสำเร็จ ${updated?.length || 0} รายการ (สถานะ: ข้อมูล backup)`,
    }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error during batch restore:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ในการกู้คืนข้อมูล',
    })
  }
})