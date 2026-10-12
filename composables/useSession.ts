import type { AccessRole, AccessPermission } from '~/constants/roles'
import { joinRoleLabels } from '~/constants/roles'

/**
 * useSession
 * จัดการ session ของผู้ใช้งานเข้าถึงระบบ (คล้าย login แบบไม่มีรหัสผ่าน)
 * 1 user มีได้หลาย role — สิทธิ์รวมทุกบทบาทที่บัญชีมี (session.roles)
 */
export const useSession = () => {
  const session = useState<any>('hc-session', () => null)

  const { t } = useSafeI18n()

  // บทบาททั้งหมดของบัญชี
  const roles = computed<AccessRole[]>(() => {
    const s = session.value
    if (!s) return []
    return Array.isArray(s.roles) && s.roles.length ? s.roles : (s.role ? [s.role] : [])
  })

  // บทบาทหลัก (ตัวแรก) — ใช้สำหรับหน้าแรก/แสดงป้ายย่อ
  const role = computed<AccessRole | null>(() => session.value?.role || roles.value[0] || null)

  const asAdmin = computed(() => roles.value.includes('Admin'))

  // เจ้าหน้าที่ รปภ. เฉพาะ (ไม่ใช่ Admin / Clinic_staff) — หน้า/เมนูต่างจากคนอื่น
  // (ถ้าเป็น hybrid เช่น Clinic_staff + รปภ. ถือว่าเป็นเจ้าหน้าที่ปกติ ไม่ล็อกหน้าข้อมูลผู้ป่วย)
  const isGuard = computed(
    () => roles.value.includes('Security_guard') && !roles.value.includes('Admin') && !roles.value.includes('Clinic_staff')
  )

  // มีสิทธิ์ใช้หน้าสแกน QR (ต้องมีบทบาท รปภ. — Admin เปิด /verify ได้แต่ไม่แสดงเมนู)
  const canScan = computed(() => roles.value.includes('Security_guard'))

  // ชื่อบทบาทตามภาษาที่เลือก (ไทย/อังกฤษ) — หลายบทบาทรวมด้วย ", "
  const roleLabel = computed(() => {
    if (!roles.value.length || !role.value) return ''
    return joinRoleLabels(roles.value, (r) =>
      t(`roles.${r}`) !== `roles.${r}` ? t(`roles.${r}`) : r
    )
  })

  const permissions = computed<AccessPermission[]>(() => session.value?.permissions || [])

  const hasPerm = (perm: AccessPermission) => permissions.value.includes(perm)

  const canCreate = computed(() => hasPerm('create'))
  const canCancel = computed(() => hasPerm('cancel'))
  const canRestore = computed(() => hasPerm('restore'))
  const canManage = computed(() => hasPerm('manage'))

  // อ่าน session ปัจจุบัน (เรียกตอนเริ่มต้นใช้งาน)
  const refresh = async () => {
    try {
      const res = await $fetch<{ session: any }>('/api/session')
      session.value = res?.session || null
    } catch {
      session.value = null
    }
    return session.value
  }

  // ระบุตัวตน — กรอกได้แค่ ชื่อ + เบอร์โทร (บทบาทถูกกำหนดจากบัญชีที่ตรงกันในระบบ)
  const login = async (payload: { full_name: string; phone_number: string; [key: string]: unknown }) => {
    const res = await $fetch<{ session: any }>('/api/session', {
      method: 'POST',
      body: payload,
    })
    session.value = res.session
    return session.value
  }

  const logout = async () => {
    try {
      await $fetch('/api/session', { method: 'DELETE' })
    } finally {
      session.value = null
    }
  }

  return {
    session,
    role,
    roles,
    roleLabel,
    asAdmin,
    isGuard,
    canScan,
    refresh,
    login,
    logout,
    hasPerm,
    canCreate,
    canCancel,
    canRestore,
    canManage,
  }
}