import { serverSupabaseClient } from '#supabase/server'
import { ROLE_PERMISSIONS } from '~/constants/roles'

/**
 * ทำชื่อให้อยู่ในรูปที่เทียบได้ง่าย: ตัดช่องว่างเกิน, เทียบแบบไม่สน case, ตัดคำนำหน้า
 * (นางสาว / นาย / นาง) เพราะผู้ใช้กรอกชื่อได้หลายรูปแบบ
 */
function normalizeStaffName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(นางสาว|นาย|นาง)\s+/g, '')
    .toLowerCase()
}

/**
 * POST /api/session
 * "Login" แบบไม่ใช้รหัสผ่าน — ระบุตัวตนด้วย ชื่อ + เบอร์โทร + role (switch button)
 * - เจ้าหน้าที่ (Admin/Clinic_staff/Security_guard): ต้องตรงกับแถวใน hospital_user
 * - Patient: ผู้ป่วยทั่วไป เลือกได้อิสระ (ไม่ต้องมีใน hospital_user)
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}

    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const phoneNumber = typeof body.phone_number === 'string' ? body.phone_number.trim() : ''
    const role = body.role

    // 1. ตรวจข้อมูลเบื้องต้น
    if (!fullName) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อผู้ใช้' })
    }
    if (fullName.length > 100) {
      throw createError({ statusCode: 400, statusMessage: 'ชื่อต้องไม่เกิน 100 ตัวอักษร' })
    }
    if (!/^\d{9,10}$/.test(phoneNumber)) {
      throw createError({ statusCode: 400, statusMessage: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก' })
    }
    if (!isAccessRole(role)) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาเลือกบทบาท (role) ที่ถูกต้อง' })
    }

    // 2. เจ้าหน้าที่ต้องมีชื่อ + role ตรงกับข้อมูลใน hospital_user (อ้างอิงจาก Supabase)
    if (role !== 'Patient') {
      const client = await serverSupabaseClient(event)
      const { data: users, error: userErr } = await client
        .from('hospital_user')
        .select('full_name, role')
        .eq('role', role)

      if (userErr) {
        console.error('Hospital user lookup error:', userErr.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองใหม่อีกครั้ง',
        })
      }

      // เปรียบเทียบชื่อแบบทนทาน: เทียบ case, ตัด space ยาว, ตัดคำนำหน้า (นางสาว/นาย/นาง)
      const matched = (users || []).find(
        (u: any) => normalizeStaffName(u.full_name) === normalizeStaffName(fullName)
      )

      if (!matched) {
        throw createError({
          statusCode: 401,
          statusMessage: 'ไม่พบผู้ใช้ "ชื่อ + บทบาท" นี้ในระบบ กรุณาตรวจสอบชื่อหรือเลือกบทบาทใหม่',
        })
      }
    }

    // 3. สร้าง session และเซ็นต์ลง cookie
    const session: AccessSession = {
      full_name: fullName,
      phone_number: phoneNumber,
      role,
      iat: Math.floor(Date.now() / 1000),
    }

    setAccessSession(event, session)

    return {
      session: {
        full_name: session.full_name,
        phone_number: session.phone_number,
        role: session.role,
        permissions: ROLE_PERMISSIONS[session.role] || [],
      },
    }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected session error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})