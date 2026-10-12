-- ===================================================
-- Function: ลบข้อมูลที่ Soft-Delete เกินกำหนดออกจากระบบถาวร
-- (จุดเริ่มเพียงจุดเดียว — อย่า define ซ้ำในไฟล์อื่น)
--
-- รับ p_retention_days เพื่อให้ฝั่ง server ส่งค่าจาก
-- constants/appointments.ts (RETENTION_DAYS) ใช้เดียวกันกับที่หน้าเว็บแสดง
-- ถ้าไม่ส่งค่า → DEFAULT 30 วัน
--
-- ส่วนตั้งเวลา pg_cron อยู่ที่ scripts/setup_purge_cron.sql
-- โค้ดฝั่ง server เรียกผ่าน rpc('purge_expired_appointments', { p_retention_days })
-- ===================================================
DROP FUNCTION IF EXISTS public.purge_expired_appointments();

CREATE OR REPLACE FUNCTION public.purge_expired_appointments(p_retention_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.appointments
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - make_interval(days => p_retention_days);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Purged % expired appointment(s).', deleted_count;
  RETURN deleted_count;
END;
$$;