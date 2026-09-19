/**
 * useAppointment Composable
 * รวม utility functions ที่ใช้ร่วมกันระหว่างหน้า appointments และ history
 */
import { RETENTION_DAYS } from '~/constants/appointments'

export const useAppointment = () => {
  const { t, locale } = useSafeI18n()

  // แปลงรหัสภาษา (th/en) เป็น Intl locale ที่ใช้จัดรูปแบบวันที่
  const intlLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'th-TH'))

  /** สีของ badge ตามสถานะ */
  const statusClass = (status: string): string => {
    const classes: Record<string, string> = {
      // 4 สถานะหลัก
      'has_right': 'tw-bg-green-100 tw-text-green-700',
      'used': 'tw-bg-blue-100 tw-text-blue-700',
      'not_used': 'tw-bg-amber-100 tw-text-amber-700',
      'no_right': 'tw-bg-red-100 tw-text-red-700',
      // fallback สำหรับค่าเก่า (ในกรณีที่ display_status ไม่มา)
      active: 'tw-bg-green-100 tw-text-green-700',
      completed: 'tw-bg-blue-100 tw-text-blue-700',
      cancelled: 'tw-bg-red-100 tw-text-red-700',
      backup: 'tw-bg-purple-100 tw-text-purple-700 tw-border tw-border-purple-200',
    }
    return classes[status] || 'tw-bg-gray-100 tw-text-gray-700'
  }

  /** แปลงข้อความสถานะตามภาษาที่เลือก (ไทย/อังกฤษ) */
  const statusLabel = (status: string): string => {
    if (!status) return '-'
    const key = `status.${status}`
    const label = t(key)
    // ถ้ายังไม่มีคีย์แปลภาษา → ใช้สถานะเดิมจาก system
    return label !== key ? label : status
  }

  /** แปลงรูปแบบวันที่ เช่น "2026-09-05" → "5 กันยายน 2569" / "September 5, 2026" */
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString(intlLocale.value, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /** แปลงรูปแบบวันที่ + เวลา เช่น "5 ก.ย. 2569 14:30" / "Sep 5, 2026, 2:30 PM" */
  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr || dateStr === '-') return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleString(intlLocale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const daysUntilPurge = (deletedAt: string | null, daysUntilPurgeFromServer?: number | null): number | null => {
    if (deletedAt && typeof daysUntilPurgeFromServer === 'number') {
      return daysUntilPurgeFromServer
    }
    if (!deletedAt) return null
    const deletedTime = new Date(deletedAt).getTime()
    if (isNaN(deletedTime)) return null
    const remaining = RETENTION_DAYS * 24 * 60 * 60 * 1000 - (Date.now() - deletedTime)
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
  }

  /** ข้อความอธิบายวันเหลือก่อนลบถาวร (ตามภาษา) */
  const purgeNotice = (deletedAt: string | null, daysUntilPurgeFromServer?: number | null): string => {
    if (!deletedAt) return ''
    const days = daysUntilPurge(deletedAt, daysUntilPurgeFromServer)
    if (days === null) return ''
    if (days <= 0) return t('status.aboutToDelete')
    return t('status.autoDeleteInDays', { days })
  }

  return {
    statusClass,
    statusLabel,
    formatDate,
    formatDateTime,
    daysUntilPurge,
    purgeNotice,
  }
}