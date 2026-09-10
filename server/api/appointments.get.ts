import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/appointments
 * ดึงรายการนัดหมายทั้งหมด (ครบทุกสถานะ)
 * หน้า appointments กรองเอาเฉพาะ active/backup
 * หน้า history กรองเอาเฉพาะ cancelled/completed
 */
export default defineEventHandler(async (event) => {
  try {
    requirePermission(event, 'view')

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
        location_id,
        department:hospital_dept(dept_name_th),
        location:hospital_parking(building_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Server fetch error:', error.message)

      if (String(error.message).toLowerCase().includes('row-level security')) {
        throw createError({
          statusCode: 500,
          statusMessage: 'ฐานข้อมูลปิดกั้นการอ่าน (RLS) — ให้ผู้ดูแลรัน “.venv/bin/python scripts/setup_access.py” เพื่อกู้คืนสิทธิ์',
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'ไม่สามารถดึงข้อมูลนัดหมายได้',
      })
    }

    // แปลงผล embed ให้เป็นฟิลด์ตรงๆ ที่หน้าเว็บใช้ (department_name, building_name)
    return (data || []).map((item: any) => ({
      ...item,
      department_name: item.department?.dept_name_th || item.department?.[0]?.dept_name_th || null,
      building_name: item.location?.building_name || item.location?.[0]?.building_name || null,
      department: undefined,
      location: undefined,
    }))
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})
