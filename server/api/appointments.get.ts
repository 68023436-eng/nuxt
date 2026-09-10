import { serverSupabaseClient } from '#supabase/server'
import { RETENTION_DAYS } from '~/constants/appointments'
import { normalizeName, normalizePhone } from '~/utils/name'

/**
 * GET /api/appointments
 * ดึงรายการนัดหมายทั้งหมด (ครบทุกสถานะ)
 * หน้า appointments กรองเอาเฉพาะ active/backup
 * หน้า history กรองเอาเฉพาะ cancelled/completed
 *
 * เน้นสิทธิ์ตามบทบาท:
 * - Admin / Clinic_staff → เห็นทั้งหมด
 * - Patient → เห็นเฉพาะนัดของตัวเอง (ผูกจาก session: ชื่อ + เบอร์)
 * - Security_guard → ปฏิเสธ (ดูได้เฉพาะหน้า ตรวจสอบ QR / ประวัติการตรวจสอบ)
 */
export default defineEventHandler(async (event) => {
  try {
    const { role, ...session } = requirePermission(event, 'view')

    // รปภ. ต้องไม่เห็นข้อมูลนัดหมาย/ผู้ป่วย
    if (role === 'Security_guard') {
      throw createError({
        statusCode: 403,
        statusMessage: 'บทบาทของคุณไม่มีสิทธิ์เข้าถึงข้อมูลนัดหมาย (เฉพาะหน้า ตรวจสอบ QR / ประวัติการตรวจสอบ)',
      })
    }

    const client = await serverSupabaseClient(event)
    const retentionDays = RETENTION_DAYS

    const query = client
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

    if (role === 'Patient') {
      // ผูกเจ้าของนัดจาก session (ไม่รับ patient_id จาก client เพื่อป้องกันการแก้พารามิเตอร์)
      query
        .eq('phone_number', normalizePhone(session.phone_number))
        .eq('patient_name', normalizeName(session.full_name))
    }

    const { data, error } = await query.order('created_at', { ascending: false })

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
    // พร้อมแนบ days_until_purge ตาม clock ของเซิร์ฟเวอร์ (หน้า history แสดง "เหลือ X วัน")
    return (data || []).map((item: any) => {
      const flat = {
        ...item,
        department_name: item.department?.dept_name_th || item.department?.[0]?.dept_name_th || null,
        building_name: item.location?.building_name || item.location?.[0]?.building_name || null,
        department: undefined,
        location: undefined,
      }

      if (flat.deleted_at) {
        const elapsed = now - new Date(flat.deleted_at).getTime()
        flat.days_until_purge = Math.max(0, Math.ceil((RETENTION_MS - elapsed) / (24 * 60 * 60 * 1000)))
      } else {
        flat.days_until_purge = null
      }

      return flat
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
