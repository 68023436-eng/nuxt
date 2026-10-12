import { serverSupabaseClient } from '#supabase/server'
import { unionPermissions } from '~/constants/roles'
import { collapseSpaces, composeFullName, normalizeNameForMatch, normalizePhone } from '~/utils/name'

/**
 * POST /api/session
 * "Login" แบบไม่ใช้รหัสผ่าน — ระบุตัวตนด้วย ชื่อ + เบอร์โทร เท่านั้น
 *
 * ระบบจะค้นหาบัญชีใน hospital_user ที่มี ชื่อ + เบอร์ ตรงกัน (ทุกบทบาท)
 * แล้วเข้าใช้งานด้วย role + ชื่อของบัญชีนั้นโดยอัตโนมัติ (ไม่มีปุ่มเลือกบทบาท)
 *
 * หมายเหตุ:
 *   - เปรียบเทียบชื่อแบบทนทาน (ตัดคำนำหน้า, ไม่สนใจตัวพิมพ์/ช่องว่างซ้อน)
 *   - เบอร์ 1 เบอร์ ผูกได้แค่ 1 บัญชี (unique index ใน hospital_user)
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) || {}

    let fullName = typeof body.full_name === 'string' ? collapseSpaces(body.full_name) : ''

    if (!fullName) {
      const firstName = typeof body.first_name === 'string' ? collapseSpaces(body.first_name) : ''
      const lastName = typeof body.last_name === 'string' ? collapseSpaces(body.last_name) : ''
      if (firstName && lastName) {
        fullName = composeFullName(firstName, lastName)
      }
    }

    const phoneInput = typeof body.phone_number === 'string' ? body.phone_number.trim() : ''
    const phoneNumber = normalizePhone(phoneInput)

    if (!fullName) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อและนามสกุล' })
    }
    if (fullName.length > 100) {
      throw createError({ statusCode: 400, statusMessage: 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร' })
    }
    if (!phoneNumber || !/^\d{9,10}$/.test(phoneNumber)) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)' })
    }

    const client = await serverSupabaseClient(event)
    const { data: users, error: userErr } = await client
      .from('hospital_user')
      .select('user_id, full_name, role, roles, phone_number, is_active')

    if (userErr) {
      console.error('Hospital user lookup error:', userErr.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองใหม่อีกครั้ง',
      })
    }

    // 1) หาบัญชีจากเบอร์โทรที่ตรงกัน (normalize ทั้งสองฝั่ง — กันเบอร์ที่จัดรูปแบบต่างกัน)
    const byPhone = (users || []).find(
      (u: any) => u.phone_number && normalizePhone(u.phone_number) === phoneNumber
    )

    if (!byPhone) {
      throw createError({
        statusCode: 401,
        statusMessage: 'ไม่พบชื่อและเบอร์โทรนี้ในระบบ กรุณาตรวจสอบอีกครั้ง',
      })
    }

    // 2) ตรวจชื่อต้องตรงกับบัญชีของเบอร์นั้น ๆ
    const nameKey = normalizeNameForMatch(fullName)
    if (!byPhone.full_name || normalizeNameForMatch(byPhone.full_name) !== nameKey) {
      throw createError({
        statusCode: 401,
        statusMessage: 'ชื่อและเบอร์โทรไม่ตรงกับข้อมูลในระบบ กรุณาตรวจสอบอีกครั้ง',
      })
    }

    // 3) บัญชีถูกปิดใช้งาน → ไม่อนุญาตเข้า
    if (byPhone.is_active === false) {
      throw createError({
        statusCode: 401,
        statusMessage: 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อเจ้าหน้าที่',
      })
    }

    if (!isAccessRole(byPhone.role)) {
      throw createError({ statusCode: 500, statusMessage: 'บทบาทของบัญชีไม่ถูกต้อง กรุณาติดต่อเจ้าหน้าที่' })
    }

    // บทบาททั้งหมดของบัญชี (1 user มีได้หลาย role) — primary = role (roles[0])
    const roles: AccessRole[] = Array.isArray(byPhone.roles) && byPhone.roles.length
      ? byPhone.roles.filter(isAccessRole)
      : [byPhone.role]
    const primaryRole = (roles[0] as AccessRole) || byPhone.role

    // เข้าใช้งานด้วย role + ชื่อของบัญชีที่ตรงกัน (ไม่ใช้ข้อมูลที่กรอกมา)
    const session: AccessSession = {
      full_name: byPhone.full_name,
      phone_number: byPhone.phone_number || phoneNumber,
      role: primaryRole,
      roles,
      user_id: byPhone.user_id || undefined,
      iat: Math.floor(Date.now() / 1000),
    }

    // เซ็นต์ session ลง cookie
    setAccessSession(event, session)

    return {
      session: {
        full_name: session.full_name,
        phone_number: session.phone_number,
        role: session.role,
        roles: session.roles,
        user_id: session.user_id || null,
        permissions: unionPermissions(session.roles),
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