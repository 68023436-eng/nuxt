import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)

    // ดึงเฉพาะ columns ที่จำเป็น — ตาม schema จริงของ Supabase
    const { data, error } = await client
      .from('appointments')
      .select('appointment_id, qr_token, patient_name, appointment_date, time_slot, status, created_at, user_id, location_id, dept_id')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Server fetch error:', error.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถดึงข้อมูลนัดหมายได้',
      })
    }

    return data || []
  } catch (err: any) {
    // ถ้าเป็น createError แล้ว ให้ throw ต่อ
    if (err.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})
