export type AccessRole = 'Admin' | 'Clinic_staff' | 'Security_guard' | 'Patient'

export type AccessPermission = 'view' | 'create' | 'cancel' | 'restore' | 'manage'

// ลำดับ/รายการ role ที่ใช้ในเลือก (switch button)
export const ROLE_ORDER: AccessRole[] = ['Admin', 'Clinic_staff', 'Security_guard', 'Patient']

// บทบาทเจ้าหน้าที่ (ที่ admin จัดการได้ — มีบัญชีใน hospital_user + auth)
export const STAFF_ROLES: AccessRole[] = ['Admin', 'Clinic_staff', 'Security_guard']

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
  Admin: 'tw-from-emerald-400 tw-to-green-500',
  Clinic_staff: 'tw-from-teal-400 tw-to-emerald-500',
  Security_guard: 'tw-from-sky-400 tw-to-blue-500',
  Patient: 'tw-from-cyan-400 tw-to-teal-500',
}

export const ROLE_ICONS: Record<AccessRole, string> = {
  Admin: '👑',
  Clinic_staff: '🩺',
  Security_guard: '🛡️',
  Patient: '👤',
}

export const ROLE_BADGE_CLASSES: Record<AccessRole, string> = {
  Admin: 'tw-bg-orange-100 tw-text-orange-700 tw-rounded-full tw-py-1 tw-px-2',
  Clinic_staff: 'tw-bg-emerald-100 tw-text-emerald-700 tw-rounded-full tw-py-1 tw-px-2',
  Security_guard: 'tw-bg-blue-100 tw-text-blue-700 tw-rounded-full tw-py-1 tw-px-2',
  Patient: 'tw-bg-slate-100 tw-text-slate-700',
}

export const ROLE_AVATAR_CLASSES: Record<AccessRole, string> = {
  Admin: 'tw-bg-gradient-to-br tw-from-orange-400 tw-to-red-500',
  Clinic_staff: 'tw-bg-gradient-to-br tw-from-emerald-400 tw-to-green-500',
  Security_guard: 'tw-bg-gradient-to-br tw-from-blue-400 tw-to-indigo-500',
  Patient: 'tw-bg-slate-400',
}