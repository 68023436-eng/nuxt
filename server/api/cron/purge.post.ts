import { serverSupabaseClient } from '#supabase/server'

/**
 * POST /api/cron/purge
 * Cron endpoint ลบข้อมูลที่อยู่ในประวัติครบ 1 เดือน (30 วัน) ออกจากระบบถาวร
 *
 * ต่างจาก /api/cleanup/purge ตรงที่ endpoint นี้ใช้ header ลับ (CRON_SECRET)
 * เพราะถูกเรียกจาก cron job ภายนอกที่ไม่มี session ของผู้ใช้
 *
 * การตั้งค่าข้อมูล:
 *   .env → CRON_SECRET=... (ค่า default: hc-dev-cron-secret)
 *
 * ตัวอย่าง cron job (เรียาทุกเที่ยงคืน):
 *   0 0 * * * curl -s -X POST http://localhost:3000/api/cron/purge -H "x-cron-secret: hc-dev-cron-secret"
 */
export default defineEventHandler(async (event) => {
  try {
    // ตรวจสอบ header ลับก่อนเสมอ (กันคนนอกปลอมเรียกได้)
    const config = useRuntimeConfig(event)
    const provided = getHeader(event, 'x-cron-secret')
    const expected = (config.cronSecret as string) || 'hc-dev-cron-secret'
    if (!provided || provided !== expected) {
      throw createError({
        statusCode: 401,
        statusMessage: 'ไม่ได้รับอนุญาต (cron secret ไม่ถูกต้อง)',
      })
    }

    const client = await serverSupabaseClient(event)
    const retentionDays = 30
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()

    const { count, error: countError } = await client
      .from('appointments')
      .select('appointment_id', { count: 'exact', head: true })
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoff)

    if (countError) {
      console.error('Cron purge count error:', countError.message)
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
      console.error('Cron purge error:', purgeError.message)
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
    console.error('Unexpected cron purge error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ระหว่างล้างข้อมูล',
    })
  }
})