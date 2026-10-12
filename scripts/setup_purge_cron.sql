-- ===================================================
-- ตั้งเวลารัน Auto-Purge ด้วย pg_cron
-- ===================================================
-- หมายเหตุ:
--   * ฟังก์ชัน purge_expired_appointments() ถูกนิยามไว้ที่
--     scripts/ensure_purge_function.sql (ที่เดียว ไม่มีซ้ำ)
--   * ไฟล์นี้มีไว้ตั้งเวลา cron โดยเฉพาะ — ต้องรันผ่าน Supabase SQL Editor
--     ต่องใช้สิทธิ์ superuser ในการเปิด extension pg_cron

-- 1. เปิด Extension สำหรับตั้งเวลา
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. ลบ Job เดิมออกก่อน (ถ้ามี)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_purge_appointments') THEN
    PERFORM cron.unschedule('daily_purge_appointments');
  END IF;
END $$;

-- 3. ตั้งเวลารันอัตโนมัติทุกเที่ยงคืน (00:00 น.)
--    ส่งค่า retention 30 วันตรงให้ function (ตามค่านิยามใน ensure_purge_function.sql)
SELECT cron.schedule(
  'daily_purge_appointments',
  '0 0 * * *',
  'SELECT public.purge_expired_appointments(30);'
);