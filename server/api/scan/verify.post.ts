import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * POST /api/scan/verify
 * ตรวจสอบสิทธิ์จอดรถสำหรับ รปภ. (Smart QR Parking)
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
    if (rawValue.length > 64) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ค่าที่ใช้ตรวจสอบยาวเกินไป',
      })
    }

    let qrToken: string | null = null
    let phoneNumber: string | null = null
    if (method === 'qr') {
      qrToken = rawValue
    } else {
      phoneNumber = rawValue.replace(/[\s-]/g, '')
      if (!/^\d{9,10}$/.test(phoneNumber)) {
        phoneNumber = rawValue
      }
    }

    // ใช้ Service Role ทะลุผ่านสิทธิ์ RLS เพื่อให้ รปภ. ตรวจสอบข้อมูลได้
    const client = await serverSupabaseServiceRole(event)

    const todayKey = bangkokToday()
    let foundRecord: any = null
    let todaysRecord: any = null

    // สถานะที่ถือว่ายังใช้งานสิทธิ์ได้ (รองรับทั้ง active และ has_right)
    const validStatuses = ['active', 'has_right']

    if (method === 'qr') {
      const { data, error } = await (client as any)
        .from('appointments')
        .select('appointment_id, patient_name, phone_number, appointment_date, status')
        .eq('qr_token', qrToken)
        .in('status', validStatuses)
        .maybeSingle()

      if (error) {
        console.error('Scan verify (qr) error:', error.message)
        throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถตรวจสอบสิทธิ์ได้ในขณะนี้' })
      }
      foundRecord = data || null
      if (foundRecord && bangkokDateKey(foundRecord.appointment_date) === todayKey) {
        todaysRecord = foundRecord
      }
    } else {
      const { data, error } = await (client as any)
        .from('appointments')
        .select('appointment_id, patient_name, phone_number, appointment_date, status')
        .eq('phone_number', phoneNumber)
        .in('status', validStatuses)
        .limit(20)

      if (error) {
        console.error('Scan verify (phone) error:', error.message)
        throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถตรวจสอบสิทธิ์ได้ในขณะนี้' })
      }
      foundRecord = data && data.length > 0 ? data[0] : null
      todaysRecord = (data || []).find((a: any) => bangkokDateKey(a.appointment_date) === todayKey) || null
    }

    // ส่องดูค่าใน Terminal เพื่อเช็คผลการตรวจสอบ
    console.log('>>> Scan Verify Debug:', {
      method,
      searchedValue: method === 'qr' ? qrToken : phoneNumber,
      foundRecord,
      todayKey,
      appointmentDate: foundRecord?.appointment_date,
      isTodayMatch: !!todaysRecord
    })

    const found = !!todaysRecord
    const phoneToLog = method === 'phone'
      ? phoneNumber
      : (foundRecord?.phone_number ?? null)

    const result = found ? 'valid' : 'invalid'

    // เหตุผลประกอบผลตรวจสอบ (ไม่รั่วข้อมูลผู้ป่วย/นัดหมาย — ใช้ข้อความกลางๆ เท่านั้น)
    // ใช้แยกว่า "ไม่พบรายการ" / "นัดยังไม่ถึงวัน" / "นัดถูกยกเลิกหรือใช้สิทธิไปแล้ว"
    // เพื่อให้ รปภ. อธิบายผลให้ผู้ป่วยฟังได้ ไม่ใช่แค่เห็น "ไม่มีสิทธิ์" ลอยๆ
    let reason: string | null = null
    if (found) {
      reason = null // ถ้ามีสิทธิ์ → ไม่มีเหตุผลต้องอธิบาย
    } else if (!foundRecord) {
      reason = 'ไม่พบนัดหมายจากข้อมูล QR/เบอร์นี้\n(ตรวจสอบว่าเป็น QR ของระบบนี้หรือไม่)'
    } else if (bangkokDateKey(foundRecord.appointment_date) !== todayKey) {
      reason = 'นัดหมายนี้ยังไม่ถึงวันตรวจ ใช้สิทธิ์จอดรถได้เฉพาะวันนัดหมายเท่านั้น'
    } else {
      reason = 'นัดหมายนี้ถูกยกเลิก หรือได้ใช้สิทธิ์จอดรถไปแล้ว'
    }

    const identity = `${session.full_name} ${session.phone_number}`.trim()

    // บันทึกลงประวัติ scan_history
    try {
      const dupQ = (client as any)
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
      if (!dups || dups.length === 0) {
        await (client as any)
          .from('scan_history')
          .insert({
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
      console.warn('Scan history insert skipped:', logError?.message || logError)
    }

    return { ok: result === 'valid', result, reason }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected scan verify error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})