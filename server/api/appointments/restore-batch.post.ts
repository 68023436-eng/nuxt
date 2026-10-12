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

    // กู้คืนทุก id พร้อมกันผ่าน stored function (set status='backup' + ล้าง deleted_at)
    const { data: rows, error: updateError } = await (client as any).rpc(
      'restore_appointments',
      { p_ids: numericIds },
    )

    let updated = []
    if (updateError) {
      // fallback กันกรณี DB ยังไม่ได้สร้าง function — พฤติกรรมเดิม
      console.warn('restore_appointments rpc unavailable, falling back to client-side:', updateError.message)
      const { data: fbRows, error: fbError } = await (client as any)
        .from('appointments')
        .update({ status: 'backup', deleted_at: null })
        .in('appointment_id', numericIds)
        .select('appointment_id')

      if (fbError) {
        console.error('Server batch restore error:', fbError.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'ไม่สามารถกู้คืนข้อมูลได้',
        })
      }
      updated = (fbRows || []).map((r: any) => ({ appointment_id: r.appointment_id }))
    } else {
      updated = (rows || []).map((r: any) => ({ appointment_id: r.appointment_id }))
    }

    return {
      success: true,
      count: updated.length,
      data: updated,
      message: `กู้คืนข้อมูลสำเร็จ ${updated.length} รายการ (สถานะ: ข้อมูล backup)`,
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