-- ===================================================
-- Migration: เอาการเก็บข้อมูลทะเบียนรถออก (แทนที่ด้วยเบอร์โทร)
-- อยู่ในรูปแบบ Stored Procedure (idempotent) เพื่อเรียกซ้ำได้
--   CALL public.ensure_license_plate_nullable();
-- ===================================================
-- เดิมคอลัมน์ license_plate เป็น NOT NULL ทำให้ insert ที่ไม่ส่งค่าไม่ได้
-- เมื่อแอปเลิกเก็บทะเบียนรถ จึงปลด NOT NULL เพื่อให้เก็บเป็น NULL ได้
-- (ต้องการลบคอลัมน์ทิ้งถาวร ใช้: ALTER TABLE appointments DROP COLUMN license_plate;)

CREATE OR REPLACE PROCEDURE public.ensure_license_plate_nullable()
LANGUAGE plpgsql
AS $$
BEGIN
  ALTER TABLE public.appointments ALTER COLUMN license_plate DROP NOT NULL;
END;
$$;

CALL public.ensure_license_plate_nullable();

-- จำกัดสิทธิ์เรียก procedure นี้ (DDL migration) ให้เฉพาะผู้ดูแลฐานข้อมูล
DO $$
BEGIN
  BEGIN
    REVOKE ALL ON PROCEDURE public.ensure_license_plate_nullable() FROM PUBLIC;
    GRANT EXECUTE ON PROCEDURE public.ensure_license_plate_nullable() TO postgres;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'skip grant hardening: ensure_license_plate_nullable';
  END;
END $$;