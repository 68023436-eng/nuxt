import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/appointments
 * ดึงรายการนัดหมายทั้งหมด (ครบทุกสถานะ)
 * หน้า appointments กรองเอาเฉพาะ active/backup
 * หน้า history กรองเอาเฉพาะ cancelled/completed
 */
export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)

    const { data, error } = await client
      .from('appointments')
      .select(`
        appointment_id,
        qr_token,
        patient_name,
        phone_number,
        license_plate,
        appointment_date,
        time_slot,
        status,
        created_at,
        dept_id,
        location_id
      `)
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
    if (err.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})
