import { serverSupabaseClient } from '#supabase/server'

/**
 * POST /api/scan/verify
 * ตรวจสอบสิทธิ์จอดรถสำหรับ รปภ. (Smart QR Parking)
 *
 * - method = 'qr'    → ตรวจจาก qr_token
 * - method = 'phone' → ตรวจจาก phone_number
 *
 * ผลลัพธ์มีเพียง 2 สถานะ: valid (มีสิทธิ์จอดวันนี้) / invalid (ไม่มีสิทธิ์จอด)
 * กฎ: QR/เบอร์ ตรวจสอบผ่านเมื่อ appointment ยัง active และ appointment_date ตรงกับวันนี้ (Asia/Bangkok)
 * - นัดวันอื่น (ก่อนหน้าหรือยังไม่ถึง) → invalid แต่ยังบันทึกประวัติ
 * - NO ไม่ส่งข้อมูลผู้ป่วยหรือรายละเอียดนัดหมายกลับไป
 * ทุกครั้งที่ตรวจสอบจะบันทึก scan_history (เฉพาะรายการที่ รปภ. ตรวจสอบเอง)
 */
export default defineEventHandler(async (event) => {
  try {
    const session = requireAnyRole(event, ['Security_guard', 'Admin'])

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

    // === ตรวจสิทธิ์: qr_token หรือ phone_number ที่ตรง + ยัง active + วันที่นัด = วันนี้ (Asia/Bangkok) ===
    // foundRecord  = appointment ที่ตรงกับ QR/เบอร์ (ทุกวันที่) → ใช้เก็บชื่อ/เบอร์ไว้ในประวัติ
    // todaysRecord = appointment ที่ตรงและนัด "วันนี้" ด้วย → เท่านั้นที่ถือว่า valid (ผ่านสิทธิ์วันนี้)
    const todayKey = bangkokToday()
    let foundRecord: any = null
    let todaysRecord: any = null
    if (method === 'qr') {
      const { data, error } = await client
        .from('appointments')
        .select('appointment_id, patient_name, phone_number, appointment_date')
        .eq('qr_token', qrToken)
        .eq('status', 'active')
        .maybeSingle()
      if (error && !String(error.message).toLowerCase().includes('row-level security')) {
        console.error('Scan verify (qr) error:', error.message)
        throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถตรวจสอบสิทธิ์ได้ในขณะนี้' })
      }
      foundRecord = data || null
      // QR ของนัดวันอื่น (วานนี้/พรุ่งนี้) → รู้ว่าเป็นของใคร แต่ยังนับว่าไม่ผ่านวันนี้
      if (foundRecord && bangkokDateKey(foundRecord.appointment_date) === todayKey) {
        todaysRecord = foundRecord
      }
    } else {
      // มีได้หลายนัด → ต้องเจอ appointment ที่ active และนัดตรงกับ "วันนี้" เท่านั้น
      const { data, error } = await client
        .from('appointments')
        .select('appointment_id, patient_name, appointment_date')
        .eq('phone_number', phoneNumber)
        .eq('status', 'active')
        .limit(20)
      if (error && !String(error.message).toLowerCase().includes('row-level security')) {
        console.error('Scan verify (phone) error:', error.message)
        throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถตรวจสอบสิทธิ์ได้ในขณะนี้' })
      }
      foundRecord = data && data.length > 0 ? data[0] : null
      todaysRecord = (data || []).find((a: any) => bangkokDateKey(a.appointment_date) === todayKey) || null
    }

    const found = !!todaysRecord
    // เบอร์ที่บันทึกลงประวัติ: ค้นหาด้วยเบอร์ → เบอร์ที่กรอก, สแกน QR พบข้อมูล → เบอร์ในใบจอง
    const phoneToLog = method === 'phone'
      ? phoneNumber
      : (foundRecord?.phone_number ?? null)

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
          phone_number: phoneToLog,
          patient_name: foundRecord?.patient_name ?? null,
          appointment_id: foundRecord?.appointment_id != null ? String(foundRecord.appointment_id) : null,
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