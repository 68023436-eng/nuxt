import { ROLE_ORDER, ROLE_PERMISSIONS } from '~/constants/roles'
import type { AccessRole, AccessPermission } from '~/constants/roles'

/**
 * useSession
 * จัดการ session ของผู้ใช้งานเข้าถึงระบบ (คล้าย login แบบไม่มีรหัสผ่าน)
 */
export const useSession = () => {
  const session = useState<any>('hc-session', () => null)

  const { t } = useSafeI18n()

  const asAdmin = computed(() => session.value?.role === 'Admin')

  const role = computed<AccessRole | null>(() => session.value?.role || null)

  // ชื่อบทบาทตามภาษาที่เลือก (ไทย/อังกฤษ) — fallback เป็นตัว role เดิม
  const roleLabel = computed(() => (role.value ? (t(`roles.${role.value}`) !== `roles.${role.value}` ? t(`roles.${role.value}`) : role.value) : ''))

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

  // ระบุตัวตน (ชื่อ + เบอร์โทร + role) — คล้าย login
  const login = async (payload: { full_name: string; phone_number: string; role: AccessRole }) => {
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
    roleLabel,
    asAdmin,
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

export const useRoleOptions = () => {
  const { t } = useSafeI18n()
  return ROLE_ORDER.map((r) => ({
    value: r,
    label: t(`roles.${r}`),
    desc: t(`roles.descriptions.${r}`),
  }))
}