/**
 * DELETE /api/session
 * ออกจากระบบ — ล้าง cookie session
 */
export default defineEventHandler(async (event) => {
  clearAccessSession(event)
  return { success: true }
})