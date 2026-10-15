import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { ROLE_LABELS, STAFF_ROLES } from '~/constants/roles'
import type { AccessRole } from '~/constants/roles'
import { collapseSpaces } from '~/utils/name'
import { normalizeRoles } from '~/server/utils/access'
import { fetchAccountRoles } from '~/server/utils/userRoles'

/**
 * POST /api/admin/staff
 * สร้างบัญชีเจ้าหน้าที่ใหม่ (Admin / Clinic_staff / Security_guard)
 * - รองรับ 1 user = หลายบทบาท (roles[])
 * - ใช้ Service Role สร้าง auth user ใน Supabase Auth (user_id โยงกับ auth.users ตาม FK)
 * - สงวนสิทธิ์เฉพาะ Admin เท่านั้น
 *
 * หมายเหตุ: ระบบ login ปัจจุบันใช้ "ชื่อ + เบอร์โทร" เท่านั้น แต่ต้องมีอีเมล + รหัสผ่าน
 * เพื่อสร้าง auth user ให้ FK สมบูรณ์
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'manage')

    const body = await readBody(event) || {}

    const fullName = typeof body.full_name === 'string' ? collapseSpaces(body.full_name) : ''
    const roles = normalizeRoles(body.roles ?? body.role, STAFF_ROLES)
    const primaryRole = roles[0] as AccessRole | undefined
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
    if (!roles.length) {
      throw createError({ statusCode: 400, statusMessage: 'กรุณาเลือกบทบาทอย่างน้อย 1 บทบาท' })
    }
    if (phoneNumber && !/^\d{9,10}$/.test(phoneNumber)) {
      throw createError({ statusCode: 400, statusMessage: 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก' })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'จำเป็นต้องมีอีเมลที่ถูกต้อง (ใช้เป็นบัญชีในระบบ)' })
    }
    if (!password || password.length < 8) {
      throw createError({ statusCode: 400, statusMessage: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
    }

    const client = await serverSupabaseClient(event)
    const serviceClient = await serverSupabaseServiceRole(event)

    // กันชื่อซ้ำ (ตรวจสอบบทบาทที่ซ้ำกัน)
    const { data: candidates, error: candErr } = await client
      .from('hospital_user')
      .select('user_id')
      .eq('full_name', fullName)

    if (candErr) {
      console.error('Check duplicate staff error:', candErr.message)
      throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' })
    }

    if (candidates && candidates.length) {
      const existingRoles = (
        await Promise.all(
          (candidates as any[]).map((cand) => fetchAccountRoles(client, String(cand.user_id)))
        )
      ).flat()
      const dupRole = roles.find((r) => existingRoles.includes(r as AccessRole))
      if (dupRole) {
        throw createError({
          statusCode: 409,
          statusMessage: `มีผู้ใช้ "ชื่อ ${fullName} (${ROLE_LABELS[dupRole]})" นี้อยู่แล้วในระบบ`,
        })
      }
    }

    // 1) สร้าง auth user ใน Supabase Auth
    const { data: authData, error: authErr } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: primaryRole, roles },
    })

    if (authErr || !authData?.user?.id) {
      console.error('Create auth user error:', authErr?.message || 'no user id')
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถสร้างบัญชีผู้ใช้ได้ (อีเมลอาจซ้ำกับบัญชีในระบบ)' })
    }

    // 2) เพิ่มข้อมูล staff ลง hospital_user (ไม่มี role/roles columns)
    const { error } = await (serviceClient as any)
      .from('hospital_user')
      .insert({
        user_id: authData.user.id,
        full_name: fullName,
        phone_number: phoneNumber || null,
        email,
        is_active: isActive,
      })

    if (error) {
      await serviceClient.auth.admin.deleteUser(authData.user.id).catch(() => {})
      console.error('Insert staff error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถเพิ่มเจ้าหน้าที่ได้' })
    }

    // 3) ผูกบทบาทใน user_role
    const { error: roleErr } = await (serviceClient as any)
      .from('user_role')
      .insert(roles.map((r: AccessRole) => ({
        user_id: authData.user.id,
        role_code: r === 'Admin' ? 'ADMIN' : r === 'Clinic_staff' ? 'CLINIC_STAFF' : 'SECURITY_GUARD',
        is_primary: r === primaryRole,
      })))

    if (roleErr) {
      await serviceClient.auth.admin.deleteUser(authData.user.id).catch(() => {})
      await (serviceClient as any).from('hospital_user').delete().eq('user_id', authData.user.id)
      console.error('Insert staff roles error:', roleErr.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถเพิ่มเจ้าหน้าที่ได้' })
    }

    return {
      user_id: authData.user.id,
      full_name: fullName,
      role: primaryRole,
      roles,
      phone_number: phoneNumber || null,
      email,
      is_active: isActive,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})