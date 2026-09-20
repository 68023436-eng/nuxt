import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { randomUUID } from 'node:crypto'
import { collapseSpaces, composeFullName, normalizePhone } from '~/utils/name'

/**
 * POST /api/patients
 * สร้างบัญชีผู้ป่วยใหม่ (เฉพาะ Clinic_staff / Admin เท่านั้น — ผู้ป่วยสมัครเองไม่ได้)
 *
 * Body:  first_name (required), last_name (required), phone_number (required)
 *        (ไม่ใช้ username / password / OTP — Login ด้วย ชื่อ + เบอร์โทร เท่านั้น)
 *
 * กติกา:
 *   - phone_number ต้อง unique ทั่วระบบ (ถ้าซ้ำ → 409 "Account นี้มีอยู่แล้ว")
 *   - ชื่อ + เบอร์จะเป็นคู่ที่ใช้สำหรับ Login (Req 8)
 *
 * ผลลัพธ์:
 *   - สร้าง auth.user (email สมมติจาก uuid เพื่อให้ FK hospital_user.user_id -> auth.users สมบูรณ์)
 *   - Insert hospital_user role='Patient' (ไม่เก็บ password)
 */
export default defineEventHandler(async (event) => {
  try {
    // สิทธิ์: Clinic_staff + Admin เท่านั้น (มี permission 'create')
    requirePermission(event, 'create')

    const body = await readBody(event) || {}

    const firstName = typeof body.first_name === 'string' ? collapseSpaces(body.first_name) : ''
    const lastName = typeof body.last_name === 'string' ? collapseSpaces(body.last_name) : ''
    const phoneNumber = typeof body.phone_number === 'string' ? normalizePhone(body.phone_number.trim()) : ''

    // --- Validation ---
    const fullName = composeFullName(firstName, lastName)
    if (!firstName || !lastName || !fullName) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อและนามสกุลของผู้ป่วย' })
    }
    if (fullName.length > 100) {
      throw createError({ statusCode: 400, statusMessage: 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร' })
    }
    if (!/^\d{9,10}$/.test(phoneNumber)) {
      throw createError({ statusCode: 400, statusMessage: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก' })
    }

    const client = await serverSupabaseClient(event)
    const serviceClient = await serverSupabaseServiceRole(event)

    // --- กัน phone ซ้ำ (Req 3/11: เบอร์ 1 เบอร์ ผูกได้ 1 Account เท่านั้น) ---
    const { data: dup, error: dupErr } = await client
      .from('hospital_user')
      .select('user_id')
      .eq('phone_number', phoneNumber)
      .limit(1)

    if (dupErr) {
      console.error('Check duplicate patient error:', dupErr.message)
      throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' })
    }
    if (dup && dup.length > 0) {
      throw createError({ statusCode: 409, statusMessage: 'เบอร์โทรศัพท์นี้มีบัญชีผู้ใช้อยู่แล้ว' })
    }

    // --- 1) สร้าง auth user (email สมมติจาก uuid ให้ FK สมบูรณ์ เหมือน pattern ของ staff) ---
    //     ไม่ได้สร้างระบบ password — ใช้ random token ไว้สร้าง auth.user ให้ครบโครงสร้างเดิมเท่านั้น
    const fakeEmail = `patient-${randomUUID()}@hospital.local`
    const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
      email: fakeEmail,
      password: randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'Patient' },
    })

    if (authErr || !authData?.user?.id) {
      console.error('Create auth user error:', authErr?.message || 'no user id')
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้ กรุณาลองใหม่' })
    }

    // --- 2) Insert hospital_user role='Patient' (ไม่เก็บ password) ---
    const { data, error } = await (serviceClient as any)
      .from('hospital_user')
      .insert({
        user_id: authData.user.id,
        full_name: fullName,
        role: 'Patient',
        phone_number: phoneNumber,
        email: fakeEmail,
        is_active: true,
      })
      .select('user_id, full_name, role, phone_number, is_active')
      .single()

    if (error) {
      await serviceClient.auth.admin.deleteUser(authData.user.id).catch(() => {})
      console.error('Insert patient error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถเพิ่มบัญชีผู้ป่วยได้' })
    }

    return data
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})