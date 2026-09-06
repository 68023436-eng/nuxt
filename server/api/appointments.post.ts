import { serverSupabaseClient } from '#supabase/server'

/** ฟังก์ชัน sanitize ข้อความป้องกัน XSS */
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/** รายการ status ที่อนุญาต */
const ALLOWED_STATUSES = ['active', 'completed', 'cancelled'] as const

/** รูปแบบเบอร์โทรศัพท์ (ตัวเลข 9-10 หลัก) */
const PHONE_REGEX = /^\d{9,10}$/

/**
 * POST /api/appointments
 * สร้างนัดหมายใหม่ พร้อม validation ครบถ้วน
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'create')

    const body = await readBody(event)

    // === Input Validation ===

    // 1. ตรวจสอบว่ามีข้อมูลที่จำเป็นครบ
    if (!body.patient_name || !body.appointment_date || !body.time_slot) {
      throw createError({
        statusCode: 400,
        statusMessage: 'กรุณากรอกข้อมูลให้ครบ (ชื่อผู้ป่วย, วันนัดหมาย, ช่วงเวลา)',
      })
    }

    // 2. ตรวจสอบชื่อผู้ป่วย (1-100 ตัวอักษร)
    const patientName = sanitizeString(String(body.patient_name))
    if (patientName.length === 0 || patientName.length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ชื่อผู้ป่วยต้องมีความยาว 1-100 ตัวอักษร',
      })
    }

    // 3. ตรวจสอบเบอร์โทรศัพท์ (ถ้าส่งมา ต้องเป็นตัวเลข 9-10 หลัก)
    let phoneNumber: string | null = null
    if (body.phone_number) {
      const cleanPhone = String(body.phone_number).replace(/\s|-/g, '')
      if (!PHONE_REGEX.test(cleanPhone)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก',
        })
      }
      phoneNumber = cleanPhone
    }

    // 4. ตรวจสอบทะเบียนรถ (ถ้าส่งมา ต้องไม่ยาวเกิน 20 ตัวอักษร)
    let licensePlate: string | null = null
    if (body.license_plate) {
      licensePlate = sanitizeString(String(body.license_plate))
      if (licensePlate.length > 20) {
        throw createError({
          statusCode: 400,
          statusMessage: 'ทะเบียนรถต้องไม่เกิน 20 ตัวอักษร',
        })
      }
    }

    // 5. ตรวจสอบวันนัดหมาย (format YYYY-MM-DD)
    const appointmentDate = String(body.appointment_date).trim()
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(appointmentDate)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'วันนัดหมายต้องอยู่ในรูปแบบ YYYY-MM-DD',
      })
    }

    // 6. ตรวจสอบ time_slot (1-30 ตัวอักษร)
    const timeSlot = sanitizeString(String(body.time_slot))
    if (timeSlot.length === 0 || timeSlot.length > 30) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ช่วงเวลาต้องมีความยาว 1-30 ตัวอักษร',
      })
    }

    // 7. ตรวจสอบ status (default: active)
    const status = body.status ? String(body.status).trim() : 'active'
    if (!ALLOWED_STATUSES.includes(status as any)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'สถานะต้องเป็น active, completed หรือ cancelled',
      })
    }

    // 8. กำหนดค่า dept_id (default: 91)
    let deptId = 91
    if (body.dept_id != null && body.dept_id !== '') {
      const parsedDeptId = Number(body.dept_id)
      if (!isNaN(parsedDeptId) && parsedDeptId > 0) {
        deptId = parsedDeptId
      }
    }

    // 9. กำหนดค่า location_id (default: 1)
    let locationId = 1
    if (body.location_id != null && body.location_id !== '') {
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

    const insertData: Record<string, any> = {
      patient_name: patientName,
      phone_number: phoneNumber,
      license_plate: licensePlate,
      appointment_date: appointmentDate,
      time_slot: timeSlot,
      status,
      qr_token: qrToken,
      dept_id: deptId,
      location_id: locationId,
    }

    const { data, error } = await client
      .from('appointments')
      .insert([insertData])
      .select('appointment_id, qr_token, patient_name, appointment_date, time_slot, status, created_at, dept_id')

    if (error) {
      console.error('Server insert error details:', error)

      // FK error → คืน 400 ข้อความภาษาไทยที่ชัดเจน (ไม่รั่วรายละเอียดจาก DB)
      const msg = error.message || ''
      if (msg.includes('appointments_dept_id_fkey')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'แผนกที่เลือกไม่มีในระบบ กรุณาเลือกแผนกจากแบบฟอร์ม',
        })
      }
      if (msg.includes('appointments_location_id_fkey')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'สถานที่จอดรถที่เลือกไม่มีในระบบ',
        })
      }
      if (msg.toLowerCase().includes('row-level security')) {
        throw createError({
          statusCode: 500,
          statusMessage: 'ฐานข้อมูลปิดกั้นการบันทึก (RLS) — ให้ผู้ดูแลรัน “.venv/bin/python scripts/setup_access.py” เพื่อกู้คืนสิทธิ์',
        })
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
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
