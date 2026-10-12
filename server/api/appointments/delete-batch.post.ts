import { serverSupabaseClient } from '#supabase/server'
import { RETENTION_DAYS } from '~/constants/appointments'

/**
 * POST /api/appointments/delete-batch
 * ลบรายการนัดหมายหลายรายการพร้อมกัน (soft-delete ไปหน้าประวัติ)
 * body: { ids: number[] }
 * - ใช้สำหรับ "ลบที่เลือก" และ "ลบทั้งหมด"
 * - ลบ = set status='cancelled' + deleted_at=now (นับถอยหลังลบถาวรตาม RETENTION_DAYS)
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'cancel')

    const body = await readBody(event)
    const ids = body?.ids

    if (!Array.isArray(ids) || ids.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'กรุณาเลือกรายการที่จะลบก่อน',
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

    // Soft-delete ผ่าน stored function (set status='cancelled' + deleted_at=now)
    const { data: rows, error: updateError } = await (client as any).rpc(
      'set_appointment_cancelled',
      { p_ids: numericIds },
    )

    if (updateError) {
      console.error('Server batch delete error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถลบข้อมูลได้',
      })
    }

    const updated = rows || []

    return {
      success: true,
      count: updated.length,
      retention_days: RETENTION_DAYS,
      data: updated.map((r: any) => ({ appointment_id: r.appointment_id })),
      message: `ลบข้อมูลสำเร็จ ${updated.length} รายการ (เก็บในประวัติ ${RETENTION_DAYS} วัน)`,
    }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error during batch delete:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ในการลบข้อมูล',
    })
  }
})
