import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/patients
 * ดึงรายการบัญชีผู้ป่วยทั้งหมด (เฉพาะบทบาท Patient ใน hospital_user)
 * ใช้สำหรับผู้ที่สร้างใบนัดเลือกผู้ป่วยที่มีบัญชีแล้ว
 * - สิทธิ์: Admin / Clinic_staff เท่านั้น (ต้องมีสิทธิ์ create)
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'create')

    const client = await serverSupabaseClient(event)

    // ดึง user_id ที่มีบทบาท Patient (รองรับ schema ใหม่ user_role)
    const { data: roleRows, error: roleErr } = await client
      .from('user_role')
      .select('user_id')
      .eq('role_code', 'PATIENT')

    if (roleErr) {
      console.error('Fetch patient roles error:', roleErr.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลบัญชีผู้ป่วยได้' })
    }

    const ids = [...new Set((roleRows as any[] || []).map((r) => r.user_id).filter(Boolean))]
    if (!ids.length) return []

    const { data, error } = await client
      .from('hospital_user')
      .select('user_id, full_name, phone_number, is_active')
      .in('user_id', ids)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Fetch patients error:', error.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลบัญชีผู้ป่วยได้' })
    }

    return ((data as any[]) || []).map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      phone_number: p.phone_number || null,
      is_active: p.is_active !== false,
    }))
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})