import { serverSupabaseClient } from '#supabase/server'
import { STAFF_ROLES } from '~/constants/roles'
import type { AccessRole } from '~/constants/roles'

/**
 * GET /api/dashboard/stats?range=day|month&month=YYYY-MM
 * สรุปยอดสำหรับหน้า Dashboard
 * - range             : ช่วงเวลาที่กรอง = 'day' (วันนี้) หรือ 'month' (เดือนที่เลือก) ค่าเริ่มต้น = month
 * - total_visits      : จำนวนครั้งที่มาใช้บริการ (นับจาก appointment_date ในช่วงที่เลือก)
 * - total_visitors    : จำนวนผู้ใช้บริการ (ไม่ซ้ำเบอร์/ชื่อ ในช่วงที่เลือก)
 * - staff_count       : จำนวนเจ้าหน้าที่ทั้งหมด (Admin / Clinic_staff / Security_guard)
 * - top_departments   : แผนกที่คนมาใช้บริการบ่อยที่สุด (เรียงจากมากไปน้อย 10 อันดับ)
 * - scan_summary      : สรุปการเข้าใช้บริการนับจากการสแกน QR Code และการเช็คจากเบอร์โทรศัพท์
 *                       (นับจากตาราง scan_history ในช่วงที่เลือก)
 * - overview          : สรุปภาพรวมเปรียบเทียบระหว่างจำนวนนัดหมาย กับ การตรวจสิทธิ์จริง
 *                       (appointments = นัดหมายทั้งหมด, scans/qr/phone/valid/invalid = จาก scan_history)
 * เปิดให้เฉพาะ Admin / Clinic_staff (มีสิทธิ์ view ข้อมูลนัดหมายทั้งหมด)
 */
export default defineEventHandler(async (event) => {
  try {
    const session = requirePermission(event, 'view')

    // สถิติรวมเปิดให้เฉพาะ Admin / Clinic_staff — พิจารณาจากทุกบทบาทที่บัญชีมี (union)
    const userRoles: AccessRole[] = session.roles?.length ? session.roles : [session.role]
    if (!userRoles.some((r) => r === 'Admin' || r === 'Clinic_staff')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'บทบาทของคุณไม่มีสิทธิ์เข้าถึงสถิติรวม (เฉพาะ Admin / เจ้าหน้าที่คลินิก)',
      })
    }

    const client = await serverSupabaseClient(event)

    // ช่วงเวลาที่เลือก: 'day' = วันนี้, 'month' = เดือนที่เลือก (ค่าเริ่มต้น = เดือนนี้ตาม Asia/Bangkok)
    const query = getQuery(event)
    const range: 'day' | 'month' = query.range === 'day' ? 'day' : 'month'
    const month = readMonthParam(query.month)
    const todayKey = bangkokToday()

    // ขอบเขตของ appointment_date (date column รูป 'YYYY-MM-DD')
    let startKey: string
    let endKey: string | null
    if (range === 'day') {
      startKey = todayKey
      endKey = null // ใช้วันเดียว → กรองด้วย eq
    } else {
      startKey = `${month}-01`
      const { year, m } = parseMonth(month)
      const nextMonth = new Date(Date.UTC(year, m, 1))
      endKey = bangkokDateKey(nextMonth) // 'YYYY-MM-01' ของเดือนถัดไป
    }

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

    // === 2) รายการนัดหมาย/การใช้บริการภายในช่วงที่เลือก ===
    let apptQuery = client
      .from('appointments')
      .select('patient_name, phone_number, dept_id, department:hospital_dept(dept_name_th)')
    apptQuery = range === 'day'
      ? apptQuery.eq('appointment_date', startKey)
      : apptQuery.gte('appointment_date', startKey).lt('appointment_date', endKey as string)

    const { data: appts, error: apptErr } = await apptQuery

    if (apptErr) {
      console.error('Dashboard appointments error:', apptErr.message)
      throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลการใช้บริการได้' })
    }

    // === 3) รวมสถิติในฝั่ง server ===
    const rows = appts || []

    // จำนวนครั้งที่มาใช้บริการ (ทุกนัดในช่วงที่เลือก)
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

    // === 4) สรุปการเข้าใช้บริการนับจากการสแกน QR / เช็คเบอร์โทร (scan_history) ===
    const scanSummary = await loadScanSummary(client, range, month)

    // === 5) สรุปภาพรวมเปรียบเทียบระหว่างนัดหมาย กับ การตรวจสิทธิ์จริง ===
    const overview = {
      appointments: totalVisits,
      scans: scanSummary.total,
      qr: scanSummary.qr,
      phone: scanSummary.phone,
      valid: scanSummary.valid,
      invalid: scanSummary.invalid,
    }

    return {
      range,
      month,
      total_visits: totalVisits,
      total_visitors: totalVisitors,
      staff_count: staffCount ?? 0,
      top_departments: topDepartments,
      scan_summary: scanSummary,
      overview,
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

interface ScanSummary {
  total: number
  qr: number
  phone: number
  valid: number
  invalid: number
}

/**
 * สรุปการเข้าใช้บริการจากตาราง scan_history ในช่วงที่เลือก (Asia/Bangkok)
 * - qr      : จำนวนครั้งที่ตรวจด้วยการสแกน QR Code
 * - phone   : จำนวนครั้งที่ตรวจด้วยการค้นหาเบอร์โทรศัพท์
 * - valid   : จำนวนครั้งที่พบสิทธิ์ (เข้าใช้บริการได้)
 * - invalid : จำนวนครั้งที่ไม่พบสิทธิ์
 * ถ้าตาราง scan_history ยังไม่ถูก migrate จะคืนค่าศูนย์โดยไม่ทำให้ Dashboard ล่ม
 */
async function loadScanSummary(client: any, range: 'day' | 'month', month: string): Promise<ScanSummary> {
  const summary: ScanSummary = { total: 0, qr: 0, phone: 0, valid: 0, invalid: 0 }

  // ขอบเขตคอลัมน์ created_at (timestamptz) เป็น ISO string
  let startIso: string
  let endIso: string
  if (range === 'day') {
    const { start, end } = bangkokDayRangeToday()
    startIso = start.toISOString()
    endIso = end.toISOString()
  } else {
    ;({ startIso, endIso } = bangkokMonthRange(month))
  }

  const { data, error } = await client
    .from('scan_history')
    .select('method, result')
    .gte('created_at', startIso)
    .lt('created_at', endIso)

  if (error) {
    const msg = String(error.message || '')
    if (/could not find the table|does not exist|row-level security/i.test(msg)) {
      console.warn('Dashboard scan summary unavailable (migration not run yet):', msg)
      return summary
    }
    console.error('Dashboard scan summary error:', msg)
    throw createError({ statusCode: 500, statusMessage: 'ไม่สามารถดึงข้อมูลสรุปการสแกนได้' })
  }

  for (const row of (data as any[]) || []) {
    summary.total += 1
    if (row.method === 'qr') summary.qr += 1
    else if (row.method === 'phone') summary.phone += 1
    if (row.result === 'valid') summary.valid += 1
    else if (row.result === 'invalid') summary.invalid += 1
  }

  return summary
}

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
