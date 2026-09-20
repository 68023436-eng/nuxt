import { serverSupabaseClient } from '#supabase/server'
import { RETENTION_DAYS } from '~/constants/appointments'

/**
 * สถานะแสดงผลของการนัดหมาย — คำนวณจากข้อมูลจริง (ไม่เก็บใน DB)
 * 4 สถานะเท่านั้น:
 *   has_right = มีสิทธิ        → นัดยังไม่ถึง/ถึงวันนี้ ยังไม่เคยสแกนผ่าน
 *   used      = ใช้สิทธิไปแล้ว  → มีประวัติสแกนผ่าน (scan_history result='valid') หรือนัดเสร็จสิ้นแล้ว
 *   not_used  = ไม่ได้ใช้สิทธิ  → นัดผ่านวันไปแล้วแต่ไม่เคยสแกนผ่าน
 *   no_right  = ไม่มีสิทธิ      → รายการถูกยกเลิก/ลบแล้ว
 */
function deriveAppointmentStatus(item: any, todayKey: string, usedAppointmentIds: Set<string>): string {
  // ยกเลิก/ลบแล้ว → ไม่มีสิทธิ
  if (item.status === 'cancelled' || item.deleted_at) return 'no_right'
  // เสร็จสิ้นแล้ว → ถือว่าใช้สิทธิไปแล้ว
  if (item.status === 'completed') return 'used'
  // เคยสแกนผ่าน (จริงที่รปภ.กด valid) → ใช้สิทธิไปแล้ว
  if (item.appointment_id != null && usedAppointmentIds.has(String(item.appointment_id))) return 'used'
  // วันนัดผ่านไปแล้ว และไม่เคยสแกนผ่าน → ไม่ได้ใช้สิทธิ
  const apptKey = bangkokDateKey(item.appointment_date)
  if (apptKey && apptKey < todayKey) return 'not_used'
  // ยังมาไม่ถึง / ถึงวันนี้ และยังไม่เคยใช้ → มีสิทธิ
  return 'has_right'
}

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

    // Patient ดูได้เฉพาะนัดของตัวเองเท่านั้น (ผูกจาก session.user_id = บัญชีผู้ป่วย)
    // — ไม่รับ user_id/patient_id จาก query เลย ป้องกันการแก้พารามิเตอร์เพื่อดูของคนอื่น
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
        department:hospital_dept(dept_name_th, dept_name_en),
        location:hospital_parking(building_name)
      `)

    if (role === 'Patient') {
      // Patient ดูได้เฉพาะนัดของตัวเองเท่านั้น
      // ผูกเจ้าของจาก session.user_id (account ที่สร้างไว้) — ไม่รับ user_id/patient_id จาก client
      // (Req 10: ผู้ป่วยเห็นเฉพาะนัดของตัวเอง ผูกจาก Account ไม่สามารถแก้จาก URL ได้)
      if (!session.user_id) {
        throw createError({ statusCode: 403, statusMessage: 'ไม่สามารถระบุบัญชีผู้ป่วยได้ กรุณาเข้าสู่ระบบใหม่' })
      }
      query.eq('user_id', session.user_id)
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

    // === ดึงรายการที่เคย "สแกนผ่าน" (ใช้สิทธิแล้ว) จาก scan_history ===
    // appointment_id ใน scan_history เป็น text (อาจมี '50' หรือ 'null') → ทำ Set เทียบกับ id ของนัด
    const usedAppointmentIds = new Set<string>()
    try {
      const { data: usedRows } = await client
        .from('scan_history')
        .select('appointment_id')
        .eq('result', 'valid')
      if (usedRows && usedRows.length > 0) {
        for (const row of usedRows) {
          const id = String((row as any)?.appointment_id ?? '').trim()
          if (id && id !== 'null') usedAppointmentIds.add(id)
        }
      }
    } catch (scanErr: any) {
      // โต๊ะประวัติยังไม่มี / ยังไม่ migrate → ไม่พังการแสดงสถานะ (ทุกนัดนับเป็นยังไม่ใช้)
      console.warn('scan_history lookup skipped:', scanErr?.message || scanErr)
    }
    const todayKey = bangkokToday()

    const now = Date.now()
    const RETENTION_MS = retentionDays * 24 * 60 * 60 * 1000

    // แปลงผล embed ให้เป็นฟิลด์ตรงๆ ที่หน้าเว็บใช้ (department_name, building_name)
    // พร้อมกรองรายการที่ deleted_at เกิน 30 วันออก (ข้อมูลถูกลบถาวรแล้ว)
    const filtered = (data || []).map((item: any) => ({
      ...item,
      department_name: (getCookie(event, 'hc_locale') === 'en'
        ? (item.department?.dept_name_en || item.department?.[0]?.dept_name_en)
        : (item.department?.dept_name_th || item.department?.[0]?.dept_name_th)) || null,
      building_name: item.location?.building_name || item.location?.[0]?.building_name || null,
      department: undefined,
      location: undefined,
    })).filter((item: any) => {
      if (!item.deleted_at) return true
      const deletedTime = new Date(item.deleted_at).getTime()
      return now - deletedTime < RETENTION_MS
    })

    // แนบเหลือวันที่จะถูกลบถาวร เพื่อให้หน้าเว็บแสดง "เหลือ X วัน"
    // และแนบ display_status (สถานะ 4 แบบคำนวณจากข้อมูลจริง)
    return filtered.map((item: any) => {
      if (item.deleted_at) {
        const elapsed = now - new Date(item.deleted_at).getTime()
        item.days_until_purge = Math.max(0, Math.ceil((RETENTION_MS - elapsed) / (24 * 60 * 60 * 1000)))
      } else {
        item.days_until_purge = null
      }
      item.display_status = deriveAppointmentStatus(item, todayKey, usedAppointmentIds)
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
