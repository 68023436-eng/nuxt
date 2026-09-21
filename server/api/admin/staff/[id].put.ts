import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { ROLE_LABELS, STAFF_ROLES } from '~/constants/roles'
import type { AccessRole } from '~/constants/roles'
import { collapseSpaces, normalizePhone } from '~/utils/name'
import { normalizeRoles, setAccessSession } from '~/server/utils/access'

/**
 * PUT /api/admin/staff/:id
 * แก้ไขข้อมูลเจ้าหน้าที่
 * - ปรับข้อมูลใน hospital_user + อัปเดต auth user (email/rหัสผ่าน) ถ้ามีการเปลี่ยน
 * - รองรับหลายบทบาท (roles[])
 * - เจ้าหน้าที่ทุกคน (รวม Admin) แก้ไขข้อมูลของตัวเองได้ (ชื่อ/เบอร์/อีเมล/รหัสผ่าน)
 *   แต่ ห้ามแก้ไขบทบาทของตัวเองเอง และห้ามปิดใช้บัญชีตัวเอง (กันยกระดับสิทธิ์/ล็อกตัวเอง)
 */
export default defineEventHandler(async (event) => {
  try {
    const adminSession = requirePermission(event, 'manage')

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ไม่พบ ID เจ้าหน้าที่' })
    }

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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'รูปแบบอีเมลไม่ถูกต้อง' })
    }
    if (password && password.length < 8) {
      throw createError({ statusCode: 400, statusMessage: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
    }

    const client = await serverSupabaseClient(event)
    const serviceClient = await serverSupabaseServiceRole(event)

    // ดึงข้อมูลเดิมก่อน (ตรวจว่ามีอยู่จริง + เทียบกับบัญชีตัวเอง)
    const { data: existing, error: findErr } = await client
      .from('hospital_user')
      .select('user_id, full_name, role, roles, email')
      .eq('user_id', id)
      .maybeSingle()

    if (findErr) {
      console.error('Find staff error:', findErr.message)
      throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล' })
    }
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'ไม่พบเจ้าหน้าที่' })
    }

    const target = existing as any
    const isSelf = String(target?.user_id) === String(adminSession?.user_id)

    if (isSelf) {
      // แก้ไขตัวเอง: ต้องไม่เปลี่ยนบทบาท + ห้ามปิดใช้บัญชีตัวเอง
      const currentRoles = normalizeRoles(target?.roles ?? target?.role, STAFF_ROLES)
      if (JSON.stringify(currentRoles) !== JSON.stringify(roles)) {
        throw createError({ statusCode: 403, statusMessage: 'ไม่สามารถแก้ไขบทบาทของตัวเองได้' })
      }
      if (!isActive) {
        throw createError({ statusCode: 403, statusMessage: 'ไม่สามารถปิดใช้บัญชีของตัวเองได้' })
      }
    } else {
      // กันชื่อซ้ำ (ถ้าชื่อ/บทบาทเปลี่ยนไป ต้องไม่ชนกับคนอื่น)
      if (fullName !== target?.full_name || JSON.stringify(normalizeRoles(target?.roles ?? target?.role, STAFF_ROLES)) !== JSON.stringify(roles)) {
        const checks = await Promise.all(
          roles.map((r) =>
            client
              .from('hospital_user')
              .select('user_id')
              .eq('full_name', fullName)
              .contains('roles', [r])
              .neq('user_id', id)
              .maybeSingle()
          )
        )
        const errOne = checks.find((c) => c.error)
        if (errOne?.error) {
          console.error('Check duplicate staff error:', errOne.error.message)
          throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' })
        }
        const dupRole = roles.find((r, i) => checks[i].data)
        if (dupRole) {
          throw createError({
            statusCode: 409,
            statusMessage: `มีผู้ใช้ "ชื่อ ${fullName} (${ROLE_LABELS[dupRole]})" นี้อยู่แล้วในระบบ`,
          })
        }
      }
    }

    // 1) อัปเดต auth user ถ้า email หรือ password เปลี่ยน
    if (email && (email !== target?.email || password)) {
      const attrs: Record<string, any> = {}
      if (email !== target?.email) attrs.email = email
      if (password) attrs.password = password
      const { error: authErr } = await serviceClient.auth.admin.updateUserById(id, attrs)
      if (authErr) {
        console.error('Update auth user error:', authErr.message)
        throw createError({
          statusCode: 500,
          statusMessage: 'ไม่สามารถอัปเดตบัญชีผู้ใช้ได้',
        })
      }
    }

    // 2) อัปเดต hospital_user (ปกติ PrimaryRole จะไม่เปลี่ยนตอนแก้ไขตัวเอง)
    const updateData: Record<string, any> = {
      full_name: fullName,
      role: primaryRole,
      roles,
      phone_number: phoneNumber ? normalizePhone(phoneNumber) : null,
      email: email || null,
      is_active: isActive,
    }

    const { data, error } = await client
      .from('hospital_user')
      .update(updateData)
      .eq('user_id', id)
      .select('user_id, full_name, role, roles, phone_number, email, is_active')
      .single()

    if (error) {
      console.error('Update staff error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถแก้ไขเจ้าหน้าที่ได้' })
    }

    // ถ้าแก้ไขข้อมูลของตัวเองให้ update cookie session ทันที (ชื่อ/เบอร์เปลี่ยน)
    if (isSelf && adminSession) {
      setAccessSession(event, {
        full_name: data.full_name || adminSession.full_name,
        phone_number: data.phone_number || adminSession.phone_number,
        role: (data.roles && Array.isArray(data.roles) && data.roles.length ? data.roles[0] : data.role || adminSession.role) as AccessRole,
        roles: (Array.isArray(data.roles) && data.roles.length ? data.roles : [data.role || adminSession.role]) as AccessRole[],
        user_id: adminSession.user_id,
        iat: Math.floor(Date.now() / 1000),
      })
    }

    return data
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})