import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/scan/history
 * ประวัติการตรวจสอบของ รปภ. คนปัจจุบัน (ที่ลง session ไว้)
 * - แสดงเฉพาะรายการที่ รปภ. คนนี้ตรวจสอบเองเท่านั้น (ไม่ใช่ประวัตินัดหมายทั้งหมดของผู้ป่วย)
 * - เปิดเผยเฉพาะ: วัน/เวลา, วิธีตรวจสอบ, ผลการตรวจสอบ
 */
export default defineEventHandler(async (event) => {
  try {
    const session = requirePermission(event, 'view')

    const identity = `${session.full_name} ${session.phone_number}`.trim()

    const client = await serverSupabaseClient(event)

    const { data, error } = await client
      .from('scan_history')
      .select('id, method, result, created_at')
      .eq('checked_by', identity)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      // ยังไม่สร้างตาราง scan_history (ยังไม่ migrate) → คืน [] ไม่พังหน้า
      const msg = String(error.message || '')
      if (/row-level security|could not find the table|does not exist/i.test(msg)) {
        console.warn('Scan history unavailable (migration not run yet):', msg)
        return []
      }
      console.error('Server scan history error:', msg)
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถดึงประวัติการตรวจสอบได้',
      })
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      method: item.method,
      result: item.result,
      created_at: item.created_at,
    }))
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected scan history error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})