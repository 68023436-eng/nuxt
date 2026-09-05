/**
 * useAppointment Composable
 * รวม utility functions ที่ใช้ร่วมกันระหว่างหน้า appointments และ history
 */
export const useAppointment = () => {
  /** สีของ badge ตามสถานะ */
  const statusClass = (status: string): string => {
    const classes: Record<string, string> = {
      active: 'tw-bg-green-100 tw-text-green-700',
      completed: 'tw-bg-blue-100 tw-text-blue-700',
      cancelled: 'tw-bg-red-100 tw-text-red-700',
      backup: 'tw-bg-purple-100 tw-text-purple-700 tw-border tw-border-purple-200',
    }
    return classes[status] || 'tw-bg-gray-100 tw-text-gray-700'
  }

  /** แปลงข้อความสถานะเป็นภาษาไทย */
  const statusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      active: 'กำลังใช้งาน',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิกแล้ว',
      backup: 'ข้อมูล backup',
    }
    return labels[status] || status || '-'
  }

  /** แปลงรูปแบบวันที่ เช่น "2026-09-05" → "5 กันยายน 2569" */
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /** แปลงรูปแบบวันที่ + เวลา เช่น "05/09/2026 14:30" */
  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr || dateStr === '-') return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return {
    statusClass,
    statusLabel,
    formatDate,
    formatDateTime,
  }
}
