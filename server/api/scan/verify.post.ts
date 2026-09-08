import { serverSupabaseClient } from '#supabase/server'

/**
 * POST /api/scan/verify
 * ตรวจสอบสิทธิ์จอดรถสำหรับ รปภ. (Smart QR Parking)
 *
 * - method = 'qr'    → ตรวจจาก qr_token
 * - method = 'phone' → ตรวจจาก phone_number
 *
 * ผลลัพธ์มีเพียง 2 สถานะ: valid (มีสิทธิ์จอด) / invalid (ไม่มีสิทธิ์จอด)
 * NO ไม่ส่งข้อมูลผู้ป่วยหรือรายละเอียดนัดหมายกลับไป
 * ทุกครั้งที่ตรวจสอบจะบันทึก scan_history (เฉพาะรายการที่ รปภ. ตรวจสอบเอง)
 */
export default defineEventHandler(async (event) => {
  try {
    const session = requirePermission(event, 'view')

    const body = await readBody(event).catch(() => ({}))
    const method = String(body.method || 'qr').trim()
    const rawValue = String(body.value || '').trim()

    if (method !== 'qr' && method !== 'phone') {
      throw createError({
        statusCode: 400,
        statusMessage: 'method ต้องเป็น qr หรือ phone',
      })
    }
    if (!rawValue) {
      throw createError({
        statusCode: 400,
        statusMessage: 'กรุณาใส่ค่า QR Token หรือเบอร์โทรศัพท์',
      })
    }

    // ทำความสะอาดค่าที่ใช้ค้นหา
    let qrToken: string | null = null
    let phoneNumber: string | null = null
    if (method === 'qr') {
      qrToken = rawValue
    } else {
      // ตัดช่องว่าง/ขีด แล้วเอาเฉพาะตัวเลข
      phoneNumber = rawValue.replace(/[\s-]/g, '')
      if (!/^\d{9,10}$/.test(phoneNumber)) {
        // เบอร์ไม่ครบ/ผิดรูปแบบ → ถือว่าไม่มีสิทธิ์จอด (ลงประวัติเป็น invalid)
        phoneNumber = rawValue
      }
    }

    const client = await serverSupabaseClient(event)

    // === ตรวจสิทธิ์: qr_token หรือ phone_number ที่ตรง + ยัง active ===
    let found = false
    if (method === 'qr') {
      const { data, error } = await client
        .from('appointments')
        .select('appointment_id')
        .eq('qr_token', qrToken)
        .eq('status', 'active')
        .maybeSingle()
      if (error && !String(error.message).toLowerCase().includes('row-level security')) {
        console.error('Scan verify (qr) error:', error.message)
        throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถตรวจสอบสิทธิ์ได้ในขณะนี้' })
      }
      found = !!data
    } else {
      const { data, error } = await client
        .from('appointments')
        .select('appointment_id')
        .eq('phone_number', phoneNumber)
        .eq('status', 'active')
        .limit(1)
      if (error && !String(error.message).toLowerCase().includes('row-level security')) {
        console.error('Scan verify (phone) error:', error.message)
        throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถตรวจสอบสิทธิ์ได้ในขณะนี้' })
      }
      found = !!(data && data.length > 0)
    }

    const result = found ? 'valid' : 'invalid'
    const identity = `${session.full_name} ${session.phone_number}`.trim()

    // === ป้องกันสแกน/ค้นหาเดิมซ้ำ (เดียวกัน ภายใน 10 วิ) → ไม่ต้องบันทึกซ้ำ ===
    try {
      const dupQ = client
        .from('scan_history')
        .select('id')
        .eq('method', method)
        .eq('checked_by', identity)
        .eq('result', result)
        .gte('created_at', new Date(Date.now() - 10_000).toISOString())
      if (method === 'qr') {
        dupQ.eq('qr_token', qrToken)
      } else {
        dupQ.eq('phone_number', phoneNumber)
      }
      const { data: dups } = await dupQ.limit(1)
      if (!(dups && dups.length > 0)) {
        await client.from('scan_history').insert({
          method,
          qr_token: qrToken,
          phone_number: phoneNumber,
          result,
          checked_by: identity,
        })
      }
    } catch (logError: any) {
      // โต๊ะประวัติยังไม่มี / ยังไม่ migrate → ไม่พังการตรวจสอบ
      console.warn('Scan history insert skipped:', logError?.message || logError)
    }

    return { ok: result === 'valid', result }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected scan verify error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})