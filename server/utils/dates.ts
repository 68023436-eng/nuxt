// ============================================================
// Date/time helper ฝั่ง server — โซนเวลา Asia/Bangkok
// ใช้ตรวจสอบวันที่นัดหมาย (appointment_date) เทียบกับวันปัจจุบัน
// ฝั่ง server เป็นหลักเสมอ (ไม่พึ่งเวลา client) เพื่อกันแฮกเปลี่ยนนาฬิกา
// ============================================================

const BANGKOK_TZ = 'Asia/Bangkok'

function toParts(d: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal' && p.value) map[p.type] = p.value
  }
  return {
    year: map.year ?? '',
    month: map.month ?? '',
    day: map.day ??''
  }
}

/** วันปัจจุบันตาม Asia/Bangkok ในรูป 'YYYY-MM-DD' */
export function bangkokToday(): string {
  return bangkokDateKey(new Date()) || ''
}

/** แปลงค่า (string timestamp / 'YYYY-MM-DD') เป็น date key ตามโซน Asia/Bangkok */
export function bangkokDateKey(input: string | Date | null | undefined): string | null {
  if (input == null || input === '') return null
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return null
  const { year, month, day } = toParts(d)
  return `${year}-${month}-${day}`
}

/** ค่า appointment_date (date column รูป 'YYYY-MM-DD') ตรงกับวันนี้ (Asia/Bangkok) หรือไม่ */
export function isAppointmentToday(appointmentDate: string | null | undefined): boolean {
  return bangkokDateKey(appointmentDate) === bangkokToday()
}

/** ขอบเขตของ "วันนี้" ตาม Asia/Bangkok ใน UTC: [start, end) */
export function bangkokDayRangeToday(): { start: Date; end: Date } {
  const todayKey = bangkokToday()
  const [y, m, d] = todayKey.split('-').map(Number) as [number, number, number]
  // 00:00 Bangkok = 17:00 UTC ของวันก่อนหน้า
  const start = new Date(Date.UTC(y, m - 1, d - 1, 17, 0, 0))
  const end = new Date(Date.UTC(y, m - 1, d, 17, 0, 0))
  return { start, end }
}

const pad2 = (n: number): string => String(n).padStart(2, '0')

/**
 * ขอบเขตของเดือน (Asia/Bangkok) เป็น ISO string พร้อม offset +07:00
 * สำหรับกรองคอลัมน์ timestamptz เช่น scan_history.created_at: [start, end)
 * @param month 'YYYY-MM' — ถ้าไม่ถูกต้อง ใช้เดือนปัจจุบันตาม Bangkok
 */
export function bangkokMonthRange(month: string): { startIso: string; endIso: string } {
  const value = /^(\d{4})-(0[1-9]|1[0-2])$/.test(month) ? month : bangkokToday().slice(0, 7)
  const [yearStr, monthStr] = value.split('-') as [string, string]
  const year = Number(yearStr)
  const m = Number(monthStr)
  // เดือนถัดไป (รองรับข้ามปี)
  const nextYear = m === 12 ? year + 1 : year
  const nextMonth = m === 12 ? 1 : m + 1
  return {
    startIso: `${year}-${pad2(m)}-01T00:00:00+07:00`,
    endIso: `${nextYear}-${pad2(nextMonth)}-01T00:00:00+07:00`,
  }
}