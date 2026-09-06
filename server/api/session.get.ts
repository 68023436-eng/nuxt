import { serverSupabaseClient } from '#supabase/server'

import { ROLE_PERMISSIONS } from '~/constants/roles'

/**
 * GET /api/session
 * คืนค่า session ปัจจุบัน (ถ้ายังไม่ได้เข้าถึง จะได้ session: null)
 */
export default defineEventHandler(async (event) => {
  const session = getAccessSession(event)
  if (!session) {
    return { session: null }
  }

  return {
    session: {
      full_name: session.full_name,
      phone_number: session.phone_number,
      role: session.role,
      permissions: ROLE_PERMISSIONS[session.role] || [],
    },
  }
})