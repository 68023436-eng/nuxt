import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { AccessRole } from '~/constants/roles'
import { collapseSpaces, normalizePhone } from '~/utils/name'
import { setAccessSession } from '~/server/utils/access'

/**
 * PUT /api/me
 * แก้ไขข้อมูลส่วนตัวของตัวเอง (ชื่อ/เบอร์/อีเมล/รหัสผ่าน)
 * - ห้ามแก้ไขบทบาท/สิทธิ์ของตัวเอง และห้ามปิดใช้บัญชีตัวเอง
 * - อัปเดต session cookie ทันที (ชื่อ/เบอร์เปลี่ยน)
 */
export default defineEventHandler(async (event) => {
  try {
    const session = requireSession(event)
    if (!session?.user_id) {
      throw createError({ statusCode: 401, statusMessage: 'ไม่พบข้อมูลบัญชี กรุณาเข้าสู่ระบบใหม่' })
    }

    const body = await readBody(event) || {}

    const fullName = typeof body.full_name === 'string' ? collapseSpaces(body.full_name) : ''
    const phoneNumber = typeof body.phone_number === 'string' ? body.phone_number.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    // --- Validation ---
    if (!fullName) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อ-นามสกุล' })
    }
    if (fullName.length > 100) {
      throw createError({ statusCode: 400, statusMessage: 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร' })
    }
    if (phoneNumber && !/^\d{9,10}$/.test(normalizePhone(phoneNumber))) {
      throw createError({ statusCode: 400, statusMessage: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก' })
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'รูปแบบอีเมลไม่ถูกต้อง' })
    }
    if (password && password.length < 8) {
      throw createError({ statusCode: 400, statusMessage: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
    }

    const client = await serverSupabaseClient(event)
    const serviceClient = await serverSupabaseServiceRole(event)

    const { data: existing, error: findErr } = await client
      .from('hospital_user')
      .select('user_id, full_name, phone_number, email, role, roles, is_active')
      .eq('user_id', session.user_id)
      .maybeSingle()

    if (findErr) {
      console.error('Get me error:', findErr.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลบัญชีได้' })
    }
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'ไม่พบบัญชีของคุณในระบบ' })
    }
    const me = existing as any
    if (me.is_active === false) {
      throw createError({ statusCode: 403, statusMessage: 'บัญชีของคุณถูกปิดใช้งาน' })
    }

    const nextPhone = phoneNumber ? normalizePhone(phoneNumber) : (me.phone_number || null)

    // 1) อัปเดต auth user ถ้า email/password เปลี่ยน
    if (email && (email !== me?.email || password)) {
      const attrs: Record<string, any> = {}
      if (email !== me?.email) attrs.email = email
      if (password) attrs.password = password
      const { error: authErr } = await serviceClient.auth.admin.updateUserById(session.user_id, attrs)
      if (authErr) {
        console.error('Update own auth error:', authErr.message)
        throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถอัปเดตบัญชีผู้ใช้ได้' })
      }
    }

    // 2) อัปเดต hospital_user (บทบาท/สถานะคงเดิม — แก้ได้เฉพาะข้อมูลส่วนตัว)
    const updateData: Record<string, any> = {
      full_name: fullName,
      phone_number: nextPhone,
      email: email || null,
    }

    const { data, error } = await client
      .from('hospital_user')
      .update(updateData)
      .eq('user_id', session.user_id)
      .select('user_id, full_name, phone_number, email, role, roles, is_active')
      .single()

    if (error) {
      console.error('Update me error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถบันทึกข้อมูลได้' })
    }

    // อัปเดต cookie session ทันที (ชื่อ/เบอร์เปลี่ยน)
    const allowedRoles = ['Admin', 'Clinic_staff', 'Security_guard', 'Patient']
    const currentRoles = (Array.isArray(data?.roles) && data.roles.length ? data.roles : [data?.role || session.role]).filter(
      (r: unknown): r is AccessRole => allowedRoles.includes(r as string)
    )
    setAccessSession(event, {
      full_name: data.full_name,
      phone_number: data.phone_number || session.phone_number,
      role: (data.roles?.[0] || session.role) as AccessRole,
      roles: currentRoles,
      user_id: session.user_id,
      iat: Math.floor(Date.now() / 1000),
    })

    return data
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})