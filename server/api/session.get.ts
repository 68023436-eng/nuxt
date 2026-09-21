import { serverSupabaseClient } from '#supabase/server'

import { unionPermissions } from '~/constants/roles'

/**
 * GET /api/session
 * คืนค่า session ปัจจุบัน (ถ้ายังไม่ได้เข้าถึง จะได้ session: null)
 */
export default defineEventHandler(async (event) => {
  const session = getAccessSession(event)
  if (!session) {
    return { session: null }
  }

  const roles = (session.roles || [session.role]).filter(Boolean)

  return {
    session: {
      full_name: session.full_name,
      phone_number: session.phone_number,
      role: session.role,
      roles,
      user_id: session.user_id || null,
      permissions: unionPermissions(roles),
      server_today: bangkokToday(),
    },
  }
})