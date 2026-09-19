import { serverSupabaseClient } from '#supabase/server'
import { STAFF_ROLES } from '~/constants/roles'

/**
 * GET /api/dashboard/stats?month=YYYY-MM
 * สรุปยอดสำหรับหน้า Dashboard
 * - total_visits      : จำนวนครั้งที่มาใช้บริการ (นับจาก appointment_date ในเดือนที่เลือก)
 * - total_visitors    : จำนวนผู้ใช้บริการ (ไม่ซ้ำเบอร์/ชื่อ ในเดือนที่เลือก)
 * - staff_count       : จำนวนเจ้าหน้าที่ทั้งหมด (Admin / Clinic_staff / Security_guard)
 * - top_departments   : แผนกที่คนมาใช้บริการบ่อยที่สุด (เรียงจากมากไปน้อย 10 อันดับ)
 * เปิดให้เฉพาะ Admin / Clinic_staff (มีสิทธิ์ view ข้อมูลนัดหมายทั้งหมด)
 */
export default defineEventHandler(async (event) => {
  try {
    const { role } = requirePermission(event, 'view')

    // รปภ./Patient ไม่เห็นสถิติรวม (ดูได้เฉพาะของตัวเอง / หน้า ตรวจสอบQR)
    if (role === 'Security_guard' || role === 'Patient') {
      throw createError({
        statusCode: 403,
        statusMessage: 'บทบาทของคุณไม่มีสิทธิ์เข้าถึงสถิติรวม (เฉพาะ Admin / เจ้าหน้าที่คลินิก)',
      })
    }

    const client = await serverSupabaseClient(event)

    // ขอบเขตเดือนที่เลือก (ค่าเริ่มต้น = เดือนนี้ตาม Asia/Bangkok)
    const month = readMonthParam(getQuery(event).month)

    const startKey = `${month}-01`
    const { year, m } = parseMonth(month)
    const nextMonth = new Date(Date.UTC(year, m, 1))
    const endKey = bangkokDateKey(nextMonth) // 'YYYY-MM-01' ของเดือนถัดไป

    // === 1) จำนวนเจ้าหน้าที่ทั้งหมด ===
    const { count: staffCount, error: staffErr } = await client
      .from('hospital_user')
      .select('user_id', { count: 'exact', head: true })
      .in('role', STAFF_ROLES)
      .or('is_active.is.null,is_active.eq.true')
    if (staffErr) {
      console.error('Dashboard staff count error:', staffErr.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงจำนวนเจ้าหน้าที่ได้' })
    }

    // === 2) รายการนัดหมาย/การใช้บริการภายในเดือนที่เลือก ===
    const { data: appts, error: apptErr } = await client
      .from('appointments')
      .select('patient_name, phone_number, dept_id, department:hospital_dept(dept_name_th)')
      .gte('appointment_date', startKey)
      .lt('appointment_date', endKey)

    if (apptErr) {
      console.error('Dashboard appointments error:', apptErr.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลการใช้บริการได้' })
    }

    // === 3) รวมสถิติในฝั่ง server ===
    const rows = appts || []

    // จำนวนครั้งที่มาใช้บริการ (ทุกนัดในเดือน)
    const totalVisits = rows.length

    // จำนวนผู้ใช้บริการไม่ซ้ำ (ใช้คู่ชื่อ+เบอร์เป็นตัวระบุ)
    const visitors = new Set<string>()
    for (const r of (rows as any)) {
      const key = `${r.patient_name || ''}|${r.phone_number || ''}`.trim()
      if (key) visitors.add(key)
    }
    const totalVisitors = visitors.size

    // แผนกที่มาใช้บริการบ่อย (นับ dept_id / ชื่อแผนก)
    const deptMap = new Map<string, { dept_id: string | number | null; name: string; count: number }>()
    for (const r of (rows as any)) {
      const name = r.department?.dept_name_th || r.department?.[0]?.dept_name_th || 'ไม่ระบุแผนก'
      const deptId = r.dept_id
      const mapKey = name
      const entry = deptMap.get(mapKey) || { dept_id: deptId, name, count: 0 }
      entry.count += 1
      deptMap.set(mapKey, entry)
    }
    const topDepartments = [...deptMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      month,
      total_visits: totalVisits,
      total_visitors: totalVisitors,
      staff_count: staffCount ?? 0,
      top_departments: topDepartments,
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Unexpected dashboard error:', err)
    throw createError({ statusCode: 500, statusMessage: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' })
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseMonth(month: string): { year: number; m: number } {
  const [yearStr, monthStr] = month.split('-')
  return { year: Number(yearStr), m: Number(monthStr) }
}

/** อ่านพารามิเตอร์ month (YYYY-MM) จาก query — ถ้าไม่ส่ง/ไม่ถูกต้อง ใช้เดือนปัจจุบันตาม Bangkok */
function readMonthParam(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value
  return bangkokToday().slice(0, 7)
}
