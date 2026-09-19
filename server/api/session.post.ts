import { serverSupabaseClient } from '#supabase/server'
import { ROLE_PERMISSIONS } from '~/constants/roles'
import { collapseSpaces, composeFullName, normalizeNameForMatch, normalizeNameForMatchNoSpaces, normalizePhone } from '~/utils/name'

/**
 * POST /api/session
 * "Login" แบบไม่ใช้รหัสผ่าน — ระบุตัวตนด้วย ชื่อ + เบอร์โทร + role (switch button)
 * - เจ้าหน้าที่ (Admin/Clinic_staff/Security_guard): ชื่อ + เบอร์โทร + role ต้องตรงกับแถวใน hospital_user
 * - Patient: ผู้ป่วยทั่วไป เลือกได้อิสระ (ไม่ต้องมีใน hospital_user)
 * หมายเหตุ: ชื่อจะถูก normalize (trim + ลบช่องว่างซ้อน) ก่อนเก็บใน session
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}

    const role = body.role

    // 1. ตรวจ role เบื้องต้น
    if (!isAccessRole(role)) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาเลือกบทบาท (role) ที่ถูกต้อง' })
    }

    let session: AccessSession
    let matchedUserId: string | null = null

    if (role === 'Patient') {
      // ============ Patient Login: ชื่อ + นามสกุล + เบอร์โทร (ไม่ใช้ password/OTP) ============
      const firstName = typeof body.first_name === 'string' ? collapseSpaces(body.first_name) : ''
      const lastName = typeof body.last_name === 'string' ? collapseSpaces(body.last_name) : ''
      const phoneInput = typeof body.phone_number === 'string' ? body.phone_number.trim() : ''
      const phoneNumber = normalizePhone(phoneInput)

      if (!firstName || !lastName) {
        throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อและนามสกุล' })
      }
      // ประกอบชื่อเต็มจากชื่อ+นามสกุล (normalize เหมือนตอนสร้างบัญชี)
      const fullName = composeFullName(firstName, lastName)
      if (fullName.length > 100) {
        throw createError({ statusCode: 400, statusMessage: 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร' })
      }
      if (!/^\d{9,10}$/.test(phoneNumber)) {
        throw createError({ statusCode: 400, statusMessage: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก' })
      }

      const client = await serverSupabaseClient(event)
      const { data: patients, error: err } = await client
        .from('hospital_user')
        .select('user_id, full_name, phone_number, is_active')
        .eq('role', 'Patient')

      if (err) {
        console.error('Hospital patient lookup error:', err.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองใหม่อีกครั้ง',
        })
      }

      // Req 8-10: ชื่อ + นามสกุล + เบอร์ ต้องมาจาก Account เดียวกัน
      // (เทียบชื่อแบบไม่สนใจช่องว่าง — เบอร์เป็นตัวแยก Account ที่ชื่อซ้ำกัน)
      const nameKey = normalizeNameForMatchNoSpaces(fullName)
      const matched = (patients || []).find((p: any) => {
        if (normalizeNameForMatchNoSpaces(p.full_name) !== nameKey) return false
        if (!p.phone_number || normalizePhone(p.phone_number) !== phoneNumber) return false
        return true
      })

      if (!matched) {
        // Req: ชื่อ/นามสกุล/เบอร์ ไม่ตรง → 401 ไม่สร้าง session
        throw createError({ statusCode: 401, statusMessage: 'ไม่มีบัญชีผู้ใช้นี้' })
      }

      const m = matched as any

      if (m.matched.is_active === false) {
        throw createError({ statusCode: 401, statusMessage: 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อเจ้าหน้าที่' })
      }

      session = {
        full_name: m.matched.full_name,
        phone_number: m.matched.phone_number || '',
        role,
        user_id: m.matched.user_id,
        iat: Math.floor(Date.now() / 1000),
      }
    } else {
      // ============ Staff Login: ชื่อ + นามสกุล (แยกช่อง) + เบอร์โทร + role (ระบบเดิม) ============
      const firstName = typeof body.first_name === 'string' ? collapseSpaces(body.first_name) : ''
      const lastName = typeof body.last_name === 'string' ? collapseSpaces(body.last_name) : ''
      const phoneNumber = typeof body.phone_number === 'string' ? body.phone_number.trim() : ''

      if (!firstName || !lastName) {
        throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อและนามสกุล' })
      }
      // ประกอบชื่อเต็มจากชื่อ+นามสกุล (normalize เหมือนตอนสร้าง Account) เพื่อเทียบกับ column full_name
      const fullName = composeFullName(firstName, lastName)
      if (fullName.length > 100) {
        throw createError({ statusCode: 400, statusMessage: 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร' })
      }
      if (!/^\d{9,10}$/.test(phoneNumber)) {
        throw createError({ statusCode: 400, statusMessage: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก' })
      }

      const client = await serverSupabaseClient(event)
      const { data: users, error: userErr } = await client
        .from('hospital_user')
        .select('user_id, full_name, role, phone_number')
        .eq('role', role)
        .or('is_active.is.null,is_active.eq.true')

      if (userErr) {
        console.error('Hospital user lookup error:', userErr.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองใหม่อีกครั้ง',
        })
      }

      // เปรียบเทียบชื่อแบบทนทาน: เทียบ case, ตัด space ยาว, ตัดคำนำหน้า (นางสาว/นาย/นาง)
      const matched = (users || []).find(
        (u: any) => normalizeNameForMatch(u.full_name) === normalizeNameForMatch(fullName)
      )

      if (!matched) {
        throw createError({
          statusCode: 401,
          statusMessage: 'ชื่อและเบอร์โทรไม่ตรงกับข้อมูลในระบบ หรือเลือกบทบาทเจ้าหน้าที่ผิดพลาด',
        })
      }

      // ตรวจเบอร์โทร: ชื่อและเบอร์ต้องตรงกับข้อมูลในระบบ (ถ้าในระบบมีเบอร์)
      const storedPhone = typeof (matched as any)?.phone_number === 'string'
        ? (matched as any).phone_number.replace(/[\s-]/g, '')
        : ''

      const inputPhone = (phoneNumber || '').replace(/[\s-]/g, '') // ดึงตัวแปรนี้กลับมา

      if (!storedPhone || storedPhone !== inputPhone) {
        throw createError({
          statusCode: 401,
          statusMessage: 'ชื่อและเบอร์โทรไม่ตรงกับข้อมูลในระบบ หรือเลือกบทบาทเจ้าหน้าที่ผิดพลาด',
        })
      }

      matchedUserId = (matched as any).user_id || null
      session = {
        full_name: fullName,
        phone_number: phoneNumber,
        role,
        user_id: (matchedUserId || undefined) as any,
        iat: Math.floor(Date.now() / 1000),
      }
    }
    // เซ็นต์ session ลง cookie
    setAccessSession(event, session)

    return {
      session: {
        full_name: session.full_name,
        phone_number: session.phone_number,
        role: session.role,
        user_id: session.user_id || null,
        permissions: ROLE_PERMISSIONS[session.role] || [],
        server_today: bangkokToday(),
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