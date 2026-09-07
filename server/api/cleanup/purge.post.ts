import { serverSupabaseClient } from '#supabase/server'

/**
 * POST /api/cleanup/purge
 * ลบข้อมูลที่อยู่ในประวัติครบ 1 เดือน (30 วัน) ออกจากระบบถาวร
 *
 * เมื่อกดลบ ข้อมูลจะถูกตั้ง deleted_at = ตอนลบ
 * พอครบ 30 วัน ข้อมูลนี้จะถูกลบออกจากตารางอย่างถาวรด้วย endpoint นี้
 *
 * การเรียกใช้งาน:
 *  - เรียกเองจาก Task Scheduler / Cron ทุกวัน เช่น: curl -X POST /api/cleanup/purge
 *  - หรือให้หน้าเว็บเรียกตอนเข้าใช้งาน
 * ตัวอย่าง cron (ทุกเที่ยงคืน):
 *   0 0 * * * curl -X POST http://localhost:3000/api/cleanup/purge
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'manage')
    const client = await serverSupabaseClient(event)

    const retentionDays = 30
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()

    // ค้นหาว่ามีกี่รายการที่ถึงกำหนดลบถาวร
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

    // ลบจริง (hard delete) เฉพาะรายการที่ deleted_at เกิน 30 วัน
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
      retention_days: retentionDays,
      message: `ลบข้อมูลที่ถึงกำหนดออกจากระบบแล้วจำนวน ${count || 0} รายการ`,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Unexpected cleanup error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ระหว่างล้างข้อมูล',
    })
  }
})
