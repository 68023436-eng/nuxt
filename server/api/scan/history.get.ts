import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * GET /api/scan/history
 * ประวัติการตรวจสอบของ รปภ. คนปัจจุบัน เฉพาะ "วันนี้" (Asia/Bangkok) เท่านั้น
 * - แสดงเฉพาะรายการที่ รปภ. คนนี้ตรวจสอบเองในวันนี้ (ไม่ใช่ประวัตินัดหมายทั้งหมดของผู้ป่วย)
 * - ข้อมูลเก่ายังอยู่ครบใน database (ไม่ลบ) แต่กรองด้วย created_at ว่าอยู่ในขอบเขตวันนี้
 * - เปิดเผยเพียง: ชื่อ/เบอร์ผู้ถูกตรวจ (เท่าที่บันทึกตอนตรวจ), วัน/เวลา, วิธีตรวจสอบ, ผลการตรวจสอบ
 * - ใช้การ match ด้วยเบอร์โทร (stable) กันให้ประวัติไม่หายเมื่อชื่อผู้ตรวจเปลี่ยน
 */
export default defineEventHandler(async (event) => {
  try {
    const session = requireAnyRole(event, ['Security_guard', 'Admin'])

    const identity = `${session.full_name} ${session.phone_number}`.trim()
    const phone = String(session.phone_number || '').trim()

    const client = await serverSupabaseServiceRole(event)

    // ขอบเขต "วันนี้" ตาม Asia/Bangkok ([start, end) ใน UTC) — กรองที่ query ฝั่ง server
    const { start, end } = bangkokDayRangeToday()

    let query = client
      .from('scan_history')
      .select('id, method, result, created_at, patient_name, phone_number')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    // match ด้วยเบอร์โทร (stable) เมื่อมีเบอร์ — กันประวัติหายเมื่อชื่อเปลี่ยน
    // checked_by format: "Name Phone" -> เบอร์อยู่ท้ายสุด
    if (phone) {
      query = query.like('checked_by', `%${phone}`)
    } else {
      query = query.eq('checked_by', identity)
    }

    const { data, error } = await query

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
      patient_name: item.patient_name || null,
      phone_number: item.phone_number || null,
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