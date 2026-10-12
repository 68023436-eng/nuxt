-- ===================================================
-- Function: ลบข้อมูลที่ Soft-Delete เกินกำหนด (30 วัน) ออกจากระบบถาวร
-- (ส่วนตั้งเวลา pg_cron อยู่ที่ scripts/setup_purge_cron.sql)
-- โค้ดฝั่ง server เรียกผ่าน rpc('purge_expired_appointments')
-- ===================================================
CREATE OR REPLACE FUNCTION public.purge_expired_appointments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.appointments
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Purged % expired appointment(s).', deleted_count;
  RETURN deleted_count;
END;
$$;