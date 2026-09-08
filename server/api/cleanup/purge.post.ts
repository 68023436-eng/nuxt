import { purgeExpiredAppointments } from '~/server/utils/purge'

/**
 * POST /api/cleanup/purge
 * ลบข้อมูลที่อยู่ในประวัติครบ 1 เดือน (30 วัน) ออกจากระบบถาวร
 * เรียกจากหน้าเว็บ — ต้องมีสิทธิ์ manage (Admin)
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'manage')
    return await purgeExpiredAppointments(event)
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Unexpected cleanup error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ระหว่างล้างข้อมูล',
    })
  }
})