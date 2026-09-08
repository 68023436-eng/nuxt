import { serverSupabaseClient } from '#supabase/server'
import { RETENTION_DAYS } from '~/constants/appointments'

/**
 * GET /api/appointments
 * ดึงรายการนัดหมายทั้งหมด (ครบทุกสถานะ)
 * หน้า appointments กรองเอาเฉพาะ active/backup
 * หน้า history กรองเอาเฉพาะ cancelled/completed
 *
 * ระบบลบแบบเก็บ 30 วัน: รายการที่ deleted_at เกิน 30 วัน จะถูกลบออกจากระบบ
 * (ทั้งฝั่งฐานข้อมูลผ่าน cleanup และกรองฝั่ง API ไม่ให้แสดง)
 */
export default defineEventHandler(async (event) => {
  try {
    const { role } = requirePermission(event, 'view')

    // รปภ. ต้องไม่เห็นข้อมูลนัดหมาย/ผู้ป่วย (ดูได้เฉพาะหน้า ตรวจสอบQR + ประวัติของตัวเอง)
    if (role === 'Security_guard') {
      throw createError({
        statusCode: 403,
        statusMessage: 'บทบาทของคุณไม่มีสิทธิ์เข้าถึงข้อมูลนัดหมาย (เฉพาะหน้า ตรวจสอบ QR / ประวัติการตรวจสอบ)',
      })
    }

    const client = await serverSupabaseClient(event)
    const retentionDays = RETENTION_DAYS

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
        deleted_at,
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

    const now = Date.now()
    const RETENTION_MS = retentionDays * 24 * 60 * 60 * 1000

    // แปลงผล embed ให้เป็นฟิลด์ตรงๆ ที่หน้าเว็บใช้ (department_name, building_name)
    // พร้อมกรองรายการที่ deleted_at เกิน 30 วันออก (ข้อมูลถูกลบถาวรแล้ว)
    const filtered = (data || []).map((item: any) => ({
      ...item,
      department_name: item.department?.dept_name_th || item.department?.[0]?.dept_name_th || null,
      building_name: item.location?.building_name || item.location?.[0]?.building_name || null,
      department: undefined,
      location: undefined,
    })).filter((item: any) => {
      if (!item.deleted_at) return true
      const deletedTime = new Date(item.deleted_at).getTime()
      return now - deletedTime < RETENTION_MS
    })

    // แนบเหลือวันที่จะถูกลบถาวร เพื่อให้หน้าเว็บแสดง "เหลือ X วัน"
    return filtered.map((item: any) => {
      if (item.deleted_at) {
        const elapsed = now - new Date(item.deleted_at).getTime()
        item.days_until_purge = Math.max(0, Math.ceil((RETENTION_MS - elapsed) / (24 * 60 * 60 * 1000)))
      } else {
        item.days_until_purge = null
      }
      return item
    })
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Unexpected server error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
    })
  }
})
