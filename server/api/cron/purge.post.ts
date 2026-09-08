import { purgeExpiredAppointments } from '~/server/utils/purge'

/**
 * POST /api/cron/purge
 * Cron endpoint ลบข้อมูลที่อยู่ในประวัติครบ 1 เดือน (30 วัน) ออกจากระบบถาวร
 *
 * ต่างจาก /api/cleanup/purge ตรงที่ endpoint นี้ใช้ header ลับ (CRON_SECRET)
 * เพราะถูกเรียกจาก cron job ภายนอกที่ไม่มี session ของผู้ใช้
 *
 * ตัวอย่าง cron job (เรียาทุกเที่ยงคืน):
 *   0 0 * * * curl -s -X POST http://localhost:3000/api/cron/purge -H "x-cron-secret: <CRON_SECRET จาก .env>"
 */
export default defineEventHandler(async (event) => {
  try {
    // ตรวจสอบ header ลับก่อนเสมอ (กันคนนอกปลอมเรียกได้)
    const config = useRuntimeConfig(event)
    const provided = getHeader(event, 'x-cron-secret')
    const expected = config.cronSecret as string
    if (!expected || !provided || provided !== expected) {
      throw createError({
        statusCode: 401,
        statusMessage: 'ไม่ได้รับอนุญาต (cron secret ไม่ถูกต้อง)',
      })
    }

    return await purgeExpiredAppointments(event)
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Unexpected cron purge error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ระหว่างล้างข้อมูล',
    })
  }
})