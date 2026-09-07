import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

/**
 * DELETE /api/admin/staff/:id
 * ลบบัญชีเจ้าหน้าที่ — ลบ auth user ใน Supabase Auth (FK cascade ลบ hospital_user ด้วย)
 * - ห้ามลบบัญชีของตัวเอง
 */
export default defineEventHandler(async (event) => {
  try {
    const adminSession = requirePermission(event, 'manage')

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'ไม่พบ ID เจ้าหน้าที่' })
    }

    const client = await serverSupabaseClient(event)
    const serviceClient = await serverSupabaseServiceRole(event)

    const { data: existing, error: findErr } = await client
      .from('hospital_user')
      .select('user_id, full_name, role')
      .eq('user_id', id)
      .maybeSingle()

    if (findErr) {
      console.error('Find staff error:', findErr.message)
      throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดในการค้นหาข้อมูล' })
    }
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'ไม่พบเจ้าหน้าที่' })
    }

    // ห้ามลบบัญชีตัวเอง
    const isSelf = existing.full_name === adminSession.full_name && existing.role === adminSession.role
    if (isSelf) {
      throw createError({ statusCode: 403, statusMessage: 'ไม่สามารถลบบัญชีของตัวเองได้' })
    }

    // ลบ auth user (ON DELETE CASCADE จะลบแถวใน hospital_user ตามไปด้วย)
    const { error: authErr } = await serviceClient.auth.admin.deleteUser(id)
    if (authErr) {
      console.error('Delete auth user error:', authErr.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถลบเจ้าหน้าที่ได้' })
    }

    return { success: true }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})