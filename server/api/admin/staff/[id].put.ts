import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { ROLE_LABELS, STAFF_ROLES } from '~/constants/roles'
import type { AccessRole } from '~/constants/roles'
import { collapseSpaces } from '~/utils/name'

/**
 * PUT /api/admin/staff/:id
 * แก้ไขข้อมูลเจ้าหน้าที่
 * - ปรับข้อมูลใน hospital_user + อัปเดต auth user (email/rหัสผ่าน) ถ้ามีการเปลี่ยน
 * - ห้ามแก้ไขบัญชีของตัวเอง
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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'รูปแบบอีเมลไม่ถูกต้อง' })
    }
    if (password && password.length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
    }

    const client = await serverSupabaseClient(event)
    const serviceClient = await serverSupabaseServiceRole(event)

    // ดึงข้อมูลเดิมก่อน (ตรวจว่ามีอยู่จริง + เทียบกับบัญชีตัวเอง)
    const { data: existing, error: findErr } = await client
      .from('hospital_user')
      .select('user_id, full_name, role, email')
      .eq('user_id', id)
      .maybeSingle()

    if (findErr) {
      console.error('Find staff error:', findErr.message)
      throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล' })
    }
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'ไม่พบเจ้าหน้าที่' })
    }

    // ห้ามแก้ไขบัญชีตัวเอง
    const isSelf = existing.full_name === adminSession.full_name && existing.role === adminSession.role
    if (isSelf) {
      throw createError({ statusCode: 403, statusMessage: 'ไม่สามารถแก้ไขบัญชีของตัวเองได้' })
    }

    // กันชื่อซ้ำ (ถ้าชื่อ/role เปลี่ยนไป ต้องไม่ชนกับคนอื่น)
    if (fullName !== existing.full_name || role !== existing.role) {
      const { data: dup, error: dupErr } = await client
        .from('hospital_user')
        .select('user_id')
        .eq('full_name', fullName)
        .eq('role', role)
        .neq('user_id', id)
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
    }

    // 1) อัปเดต auth user ถ้า email หรือ password เปลี่ยน
    if (email && (email !== existing.email || password)) {
      const attrs: Record<string, any> = {}
      if (email !== existing.email) attrs.email = email
      if (password) attrs.password = password
      const { error: authErr } = await serviceClient.auth.admin.updateUserById(id, attrs)
      if (authErr) {
        console.error('Update auth user error:', authErr.message)
        throw createError({
          statusCode: 500,
          statusMessage: `ไม่สามารถอัปเดตบัญชีผู้ใช้ได้ (${authErr.message})`,
        })
      }
    }

    // 2) อัปเดต hospital_user
    const updateData: Record<string, any> = {
      full_name: fullName,
      role,
      phone_number: phoneNumber || null,
      email: email || null,
      is_active: isActive,
    }

    const { data, error } = await client
      .from('hospital_user')
      .update(updateData)
      .eq('user_id', id)
      .select('user_id, full_name, role, phone_number, email, is_active')
      .single()

    if (error) {
      console.error('Update staff error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถแก้ไขเจ้าหน้าที่ได้' })
    }

    return data
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})