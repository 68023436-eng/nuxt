export type AccessRole = 'Admin' | 'Clinic_staff' | 'Security_guard' | 'Patient'

export type AccessPermission = 'view' | 'create' | 'cancel' | 'restore' | 'manage'

// ลำดับ/รายการ role ที่ใช้ในเลือก (switch button)
export const ROLE_ORDER: AccessRole[] = ['Admin', 'Clinic_staff', 'Security_guard', 'Patient']

// สิทธิ์ตาม role (อ้างอิงจากที่กำหนดว่าใครทำอะไรได้บ้าง)
export const ROLE_PERMISSIONS: Record<AccessRole, AccessPermission[]> = {
  Admin: ['view', 'create', 'cancel', 'restore', 'manage'],
  Clinic_staff: ['view', 'create', 'cancel', 'restore'],
  Security_guard: ['view', 'cancel', 'restore'],
  Patient: ['view'],
}

export const ROLE_LABELS: Record<AccessRole, string> = {
  Admin: 'แอดมิน',
  Clinic_staff: 'เจ้าหน้าที่คลินิก',
  Security_guard: 'เจ้าหน้าที่ รปภ.',
  Patient: 'ผู้ใช้ทั่วไป',
}

export const ROLE_DESCRIPTIONS: Record<AccessRole, string> = {
  Admin: 'เข้าถึงได้ทั้งหมด',
  Clinic_staff: 'กรอกข้อมูลผู้ป่วย',
  Security_guard: 'เช็ค และ ตรวจสอบข้อมูล',
  Patient: 'ดูข้อมูลนัดได้อย่างเดียว',
}

export const ROLE_COLORS: Record<AccessRole, string> = {
  Admin: 'tw-from-orange-400 tw-to-red-500',
  Clinic_staff: 'tw-from-emerald-400 tw-to-green-500',
  Security_guard: 'tw-from-blue-400 tw-to-indigo-500',
  Patient: 'tw-from-violet-400 tw-to-purple-500',
}