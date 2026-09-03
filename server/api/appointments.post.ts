import { serverSupabaseClient } from '#supabase/server'

// ฟังก์ชัน sanitize ข้อความป้องกัน XSS
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

// รายการ status ที่อนุญาต
const ALLOWED_STATUSES = ['active', 'completed', 'cancelled']

// รายการ user_id ที่มีอยู่ในระบบ hospital_user
const VALID_USER_IDS = [9601, 9602, 9045, 42]

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // === Input Validation ===

    // 1. ตรวจสอบว่ามีข้อมูลครบ
    if (!body.patient_name || !body.appointment_date || !body.time_slot) {
      throw createError({
        statusCode: 400,
        statusMessage: 'กรุณากรอกข้อมูลให้ครบ (ชื่อผู้ป่วย, วันนัดหมาย, ช่วงเวลา)',
      })
    }

    // 2. ตรวจสอบชื่อผู้ป่วย (ไม่เกิน 100 ตัวอักษร)
    const patientName = sanitizeString(String(body.patient_name))
    if (patientName.length === 0 || patientName.length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ชื่อผู้ป่วยต้องมีความยาว 1-100 ตัวอักษร',
      })
    }

    // 3. ตรวจสอบวันนัดหมาย (format YYYY-MM-DD)
    const appointmentDate = String(body.appointment_date).trim()
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(appointmentDate)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'วันนัดหมายต้องอยู่ในรูปแบบ YYYY-MM-DD',
      })
    }

    // 4. ตรวจสอบ time_slot (ไม่เกิน 30 ตัวอักษร)
    const timeSlot = sanitizeString(String(body.time_slot))
    if (timeSlot.length === 0 || timeSlot.length > 30) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ช่วงเวลาต้องมีความยาว 1-30 ตัวอักษร',
      })
    }

    // 5. ตรวจสอบ status (ถ้าไม่ระบุให้เป็น active)
    const status = body.status ? String(body.status).trim() : 'active'
    if (!ALLOWED_STATUSES.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'สถานะต้องเป็น active, completed หรือ cancelled',
      })
    }

    // 6. กำหนดค่า dept_id (ถ้าไม่ส่งมา ให้ใช้ค่าเริ่มต้น 91)
    let deptId = 91
    if (body.dept_id !== undefined && body.dept_id !== null && body.dept_id !== '') {
      const parsedDeptId = Number(body.dept_id)
      if (!isNaN(parsedDeptId) && parsedDeptId > 0) {
        deptId = parsedDeptId
      }
    }

    // 7. กำหนดค่า user_id (ถ้าไม่ส่งมาหรือ invalid ให้ใช้ค่าเริ่มต้น 9601 เพื่อผ่าน Foreign Key)
    let userId = 9601
    if (body.user_id !== undefined && body.user_id !== null && body.user_id !== '') {
      const parsedUserId = Number(body.user_id)
      if (VALID_USER_IDS.includes(parsedUserId)) {
        userId = parsedUserId
      }
    }

    // 8. กำหนดค่า location_id (ถ้าไม่ส่งมา ให้ใช้ค่าเริ่มต้น 1 เพื่อผ่าน Foreign Key)
    let locationId = 1
    if (body.location_id !== undefined && body.location_id !== null && body.location_id !== '') {
      const parsedLocationId = Number(body.location_id)
      if (!isNaN(parsedLocationId) && parsedLocationId > 0) {
        locationId = parsedLocationId
      }
    }

    // === สร้าง QR Token อัตโนมัติ ===
    const qrToken = body.qr_token
      ? sanitizeString(String(body.qr_token))
      : `QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // === Insert ข้อมูลเข้า Supabase ===
    const client = await serverSupabaseClient(event)

    const insertData = {
      patient_name: patientName,
      appointment_date: appointmentDate,
      time_slot: timeSlot,
      status: status,
      qr_token: qrToken,
      dept_id: deptId,
      user_id: userId,
      location_id: locationId,
    }

    const { data, error } = await client
      .from('appointments')
      .insert([insertData])
      .select('appointment_id, qr_token, patient_name, appointment_date, time_slot, status, created_at, user_id, location_id, dept_id')

    if (error) {
      console.error('Server insert error details:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `ไม่สามารถบันทึกข้อมูลได้: ${error.message}`,
      })
    }

    return { success: true, data: data?.[0] || null }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: `เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: ${err?.message || err}`,
    })
  }
})
