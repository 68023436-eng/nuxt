-- 1. เปิด Extension สำหรับตั้งเวลา
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. สร้างฟังก์ชันสำหรับล้างข้อมูลที่ถูก Soft-Delete เกิน 30 วัน
CREATE OR REPLACE FUNCTION purge_expired_appointments()
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

-- 3. ลบ Job เดิมออกก่อน (ถ้ามี)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_purge_appointments') THEN
    PERFORM cron.unschedule('daily_purge_appointments');
  END IF;
END $$;

-- 4. ตั้งเวลารันอัตโนมัติทุกเที่ยงคืน (00:00 น.)
SELECT cron.schedule(
  'daily_purge_appointments',
  '0 0 * * *',
  'SELECT purge_expired_appointments();'
);