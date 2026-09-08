import { serverSupabaseClient } from '#supabase/server'
import { RETENTION_DAYS } from '~/constants/appointments'

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
      .select('appointment_id, status, deleted_at')
      .eq('appointment_id', numericId)
      .single()

    if (findError || !existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'ไม่พบรายการนัดหมายนี้',
      })
    }

    // ถ้าถูกลบไปแล้ว (มี deleted_at) ไม่ต้องลบซ้ำ
    if (existing.deleted_at) {
      return { success: true, message: 'รายการนี้อยู่ในประวัติแล้ว', deleted_at: existing.deleted_at, retention_days: RETENTION_DAYS }
    }

    // Soft-delete: เก็บ deleted_at = เวลาปัจจุบัน (ข้อมูลจะค้างในประวัติ 30 วัน แล้วถูกลบถาวรอัตโนมัติ)
    const deleteTime = new Date().toISOString()
    const { error: updateError } = await client
      .from('appointments')
      .update({ deleted_at: deleteTime, status: 'cancelled' })
      .eq('appointment_id', numericId)

    if (updateError) {
      console.error('Server soft-delete error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถอัปเดตสถานะการลบข้อมูลได้',
      })
    }

    return {
      success: true,
      deleted_at: deleteTime,
      retention_days: RETENTION_DAYS,
      message: `ลบรายการเสร็จสิ้น ข้อมูลจะคงอยู่ในประวัติ ${RETENTION_DAYS} วัน แล้วถูกลบออกจากระบบอัตโนมัติ`,
    }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})
