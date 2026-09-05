import { serverSupabaseClient } from '#supabase/server'

/**
 * Health Check API
 * ทดสอบการเชื่อมต่อ Supabase จากฝั่ง server
 * ป้องกัน credentials leak ที่ client-side
 */
export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)

    const { data, error } = await client
      .from('appointments')
      .select('appointment_id')
      .limit(1)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `เชื่อมต่อ Supabase ล้มเหลว: ${error.message}`,
      })
    }

    return {
      success: true,
      message: 'เชื่อมต่อ Supabase สำเร็จ',
      count: data?.length ?? 0,
    }
  } catch (err: any) {
    if (err.statusCode) throw err

    console.error('Health check error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'ไม่สามารถตรวจสอบการเชื่อมต่อได้',
    })
  }
})
