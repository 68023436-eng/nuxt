import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { ROLE_LABELS } from '~/constants/roles'
import type { AccessRole } from '~/constants/roles'

const STAFF_ROLES: AccessRole[] = ['Admin', 'Clinic_staff', 'Security_guard']

/**
 * POST /api/admin/staff
 * สร้างบัญชีเจ้าหน้าที่ใหม่ (Admin / Clinic_staff / Security_guard)
 * - ใช้ Service Role สร้าง auth user ใน Supabase Auth (user_id โยงกับ auth.users ตาม FK)
 * - สงวนสิทธิ์เฉพาะ Admin เท่านั้น
 *
 * หมายเหตุ: ระบบ login ปัจจุบันยังใช้ "ชื่อ + role" เท่านั้น (ไม่ตรวจรหัสผ่าน/อีเมล)
 * แต่ต้องมีอีเมล + รหัสผ่านเพื่อสร้าง auth user ให้ FK สมบูรณ์
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'manage')

    const body = await readBody(event) || {}

    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const role = body.role as string
    const phoneNumber = typeof body.phone_number === 'string' ? body.phone_number.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const isActive = body.is_active !== false

    // --- Validation ---
    if (!fullName) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกชื่อ-นามสกุล' })
    }
    if (fullName.length > 100) {
      throw createError({ statusCode: 400, statusMessage: 'ชื่อต้องไม่เกิน 100 ตัวอักษร' })
    }
    if (!STAFF_ROLES.includes(role as AccessRole)) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาเลือกบทบาทเจ้าหน้าที่ที่ถูกต้อง' })
    }
    if (phoneNumber && !/^\d{9,10}$/.test(phoneNumber)) {
      throw createError({ statusCode: 400, statusMessage: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก' })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'จำเป็นต้องมีอีเมลที่ถูกต้อง (ใช้เป็นบัญชีในระบบ)' })
    }
    if (!password || password.length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
    }

    const client = await serverSupabaseClient(event)
    const serviceClient = await serverSupabaseServiceRole(event)

    // กันชื่อซ้ำในบทบาทเดียวกัน (ระบบ login ใช้ชื่อ+role ตรงกัน)
    const { data: dup, error: dupErr } = await client
      .from('hospital_user')
      .select('user_id')
      .eq('full_name', fullName)
      .eq('role', role)
      .maybeSingle()

    if (dupErr) {
      console.error('Check duplicate staff error:', dupErr.message)
      throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' })
    }
    if (dup) {
      throw createError({
        statusCode: 409,
        statusMessage: `มีผู้ใช้ "ชื่อ + ${ROLE_LABELS[role as AccessRole]}" นี้อยู่แล้วในระบบ`,
      })
    }

    // 1) สร้าง auth user ใน Supabase Auth
    const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    })

    if (authErr || !authData?.user?.id) {
      console.error('Create auth user error:', authErr?.message || 'no user id')
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้ (อีเมลอาจซ้ำกับบัญชีในระบบ)' })
    }

    // 2) เพิ่มข้อมูล staff ลง hospital_user (user_id = auth user id)
    const { data, error } = await client
      .from('hospital_user')
      .insert({
        user_id: authData.user.id,
        full_name: fullName,
        role,
        phone_number: phoneNumber || null,
        email,
        is_active: isActive,
      })
      .select('user_id, full_name, role, phone_number, email, is_active')
      .single()

    if (error) {
      // ถ้า insert hospital_user ไม่สำเร็จ ให้ลบ auth user ที่สร้างไปคืน (rollback)
      await serviceClient.auth.admin.deleteUser(authData.user.id).catch(() => {})
      console.error('Insert staff error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถเพิ่มเจ้าหน้าที่ได้' })
    }

    return data
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})