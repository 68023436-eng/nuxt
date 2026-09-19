import { serverSupabaseClient } from '#supabase/server'
import { ALLOWED_TIME_SLOTS } from '~/constants/appointments'
import { normalizePhone } from '~/utils/name'

/** ฟังก์ชัน sanitize ข้อความป้องกัน XSS */
function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/** รายการ status ที่อนุญาต */
const ALLOWED_STATUSES = ['active', 'completed', 'cancelled'] as const

/**
 * POST /api/appointments
 * สร้างนัดหมายใหม่ — ต้องเลือกผู้ป่วยที่มีบัญชีแล้ว (patient_user_id)
 * ชื่อ/เบอร์โทรของผู้ป่วยนำมาจากบัญชี (hospital_user) ฝั่ง Server
 * ไม่รับ/ไม่ trust ชื่อ+เบอร์จาก client (Req 11, 16)
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'create')

    const body = await readBody(event)

    // === Input Validation ===

    // 1. ต้องเลือกบัญชีผู้ป่วย (มี Role=Patient ใน hospital_user)
    if (!body.patient_user_id || !body.appointment_date || !body.time_slot) {
      throw createError({
        statusCode: 400,
        statusMessage: 'กรุณาเลือกผู้ป่วยที่มีบัญชี และระบุวันนัดหมาย/ช่วงเวลาให้ครบ',
      })
    }

    const patientUserId = String(body.patient_user_id).trim()

    // 2. ตรวจสอบวันนัดหมาย (format YYYY-MM-DD)
    const appointmentDate = String(body.appointment_date).trim()
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(appointmentDate)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'วันนัดหมายต้องอยู่ในรูปแบบ YYYY-MM-DD',
      })
    }

    // 3. ตรวจสอบทะเบียนรถ (ถ้าส่งมา ต้องไม่ยาวเกิน 20 ตัวอักษร)
    //    คอลัมน์เป็น NOT NULL ใน DB — ถ้าไม่ระบุให้เก็บเป็น '' แทน null
    let licensePlate = ''
    if (body.license_plate) {
      licensePlate = sanitizeString(String(body.license_plate))
      if (licensePlate.length > 20) {
        throw createError({
          statusCode: 400,
          statusMessage: 'ทะเบียนรถต้องไม่เกิน 20 ตัวอักษร',
        })
      }
    }

    // 4. ตรวจสอบ time_slot (ต้องเป็นค่าที่กำหนด)
    const timeSlot = sanitizeString(String(body.time_slot))
    if (!(ALLOWED_TIME_SLOTS as readonly string[]).includes(timeSlot)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ช่วงเวลาต้องเป็น 09:00 - 12:00 หรือ 13:00 - 16:00',
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

    // 6. กำหนดค่า dept_id (default: 91)
    let deptId = 91
    if (body.dept_id != null && body.dept_id !== '') {
      const parsedDeptId = Number(body.dept_id)
      if (!isNaN(parsedDeptId) && parsedDeptId > 0) {
        deptId = parsedDeptId
      }
    }

    // 7. กำหนดค่า location_id (default: 1)
    let locationId = 1
    if (body.location_id != null && body.location_id !== '') {
      const parsedLocationId = Number(body.location_id)
      if (!isNaN(parsedLocationId) && parsedLocationId > 0) {
        locationId = parsedLocationId
      }
    }

    // 8. ดึงข้อมูลบัญชีผู้ป่วยจาก hospital_user (Server-side — ไม่ Trust จาก client)
    const client = await serverSupabaseClient(event)
    const { data: patient, error: patientErr } = await client
      .from('hospital_user')
      .select('user_id, full_name, phone_number, role, is_active')
      .eq('user_id', patientUserId)
      .single()

    const p = patient as any

    if (p?.role !== 'Patient'){
      throw createError({
        statusCode: 400,
        statusMessage: 'บัญชีที่เลือกไม่ใช่ผู้ป่วย (Patient)',
      })
    }

    if (p?.is_active === false){
      throw createError({
        statusCode: 400,
        statusMessage: 'บัญชีผู้ป่วยนี้ถูกปิดใช้งาน',
      })
    }

    const patientName = sanitizeString(p?.full_name)
    const phoneNumber = p?.phone_number ? normalizePhone(p?.phone_number) : null
    // === สร้าง QR Token อัตโนมัติ (ใช้ crypto สำหรับความปลอดภัย) ===
    const qrToken = body.qr_token
      ? sanitizeString(String(body.qr_token))
      : `QR-${crypto.randomUUID().replace(/-/g, '').substring(0, 24).toUpperCase()}`

    // === Insert ข้อมูลเข้า Supabase ===
    const insertData: Record<string, any> = {
      user_id: patientUserId,
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
    .insert([insertData] as any) // ใส่ as any ตรงนี้ เส้นแดงหายทันที
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
    if (err?.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้งในภายหลัง',
    })
  }
})
