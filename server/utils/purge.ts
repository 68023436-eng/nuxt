import { serverSupabaseClient } from '#supabase/server'
import { RETENTION_DAYS } from '~/constants/appointments'

/**
 * ลบข้อมูลที่อยู่ในประวัติครบกำหนด (retention days) ออกจากระบบถาวร
 * ใช้ร่วมกันระหว่าง /api/cleanup/purge (session-based) และ cron ภายนอก (ถ้ามี)
 *
 * การทำงาน:
 *  1) เรียกใช้ stored function purge_expired_appointments() ผ่าน rpc (รูปแบบเดียวกับ cron)
 *  2) ถ้ายังไม่ได้สร้าง function ใน DB → fallback ใช้โค้ดฝั่ง JS เหมือนเดิม
 */
export async function purgeExpiredAppointments(event: any) {
  const client = await serverSupabaseClient(event)

  // 1) ใช้ function ใน DB เป็นตัวลบ
  const { data: purged, error: rpcError } = await (client as any).rpc('purge_expired_appointments')
  if (!rpcError) {
    const count = Number(purged) || 0
    return {
      success: true,
      purged_count: count,
      retention_days: RETENTION_DAYS,
      message: `ลบข้อมูลที่ถึงกำหนดออกจากระบบแล้วจำนวน ${count} รายการ`,
    }
  }
  console.warn('purge rpc unavailable, falling back to client-side purge:', rpcError.message)

  // 2) fallback เดิม (กันกรณี DB ยังไม่ได้สร้าง function)
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { count, error: countError } = await client
    .from('appointments')
    .select('appointment_id', { count: 'exact', head: true })
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)

  if (countError) {
    console.error('Cleanup count error:', countError.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'ไม่สามารถตรวจสอบรายการที่หมดอายุได้',
    })
  }

  const { error: purgeError } = await client
    .from('appointments')
    .delete()
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)

  if (purgeError) {
    console.error('Cleanup purge error:', purgeError.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'ไม่สามารถลบข้อมูลที่หมดอายุได้',
    })
  }

  return {
    success: true,
    purged_count: count || 0,
    retention_days: RETENTION_DAYS,
    message: `ลบข้อมูลที่ถึงกำหนดออกจากระบบแล้วจำนวน ${count || 0} รายการ`,
  }
}