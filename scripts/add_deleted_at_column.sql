-- ============================================================
-- Migration: เพิ่มคอลัมน์ deleted_at สำหรับระบบ Delete + Auto-Purge
-- 
-- วิธีรัน: 
--   psql "$DATABASE_URL" -f scripts/add_deleted_at_column.sql
--   หรือรันผ่อ Supabase Dashboard > SQL Editor
--
-- ผลลัพธ์:
--   - เพิ่มคอลัมน์ deleted_at (timestamp with time zone) ในตาราง appointments
--   - ค่า default = NULL (ข้อมูลที่ยังไม่ถูกลบ)
--   - เมื่อกดลบ → ตั้งค่าเป็นเวลาปัจจุบัน
--   - ข้อมูลจะคงอยู่ 30 วัน แล้วถูกลบอัตโนมัติ
-- ============================================================

-- เพิ่มคอลัมน์ deleted_at (ถ้ายังไม่มี)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE 'เพิ่มคอลัมน์ deleted_at สำเร็จ';
  ELSE
    RAISE NOTICE 'คอลัมน์ deleted_at มีอยู่แล้ว ข้าม';
  END IF;
END $$;

-- สร้าง index สำหรับเร่งการค้นหา (กรองรายการที่หมดอายุ)
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_at ON appointments(deleted_at);

-- สร้าง index สำหรับการ cleanup (ลบรายการที่ deleted_at < now - 30 วัน)
CREATE INDEX IF NOT EXISTS idx_appointments_purge ON appointments(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================
-- [ตัวเลือก] กำหนด deleted_at ให้กับข้อมูลเก่าที่ถูกลบ/ยกเลิกไปแล้ว
-- (ข้อมูลเก่าที่ไม่มี deleted_at จะยังคงอยู่ในประวัติไปเรื่อยๆ)
-- เปิด comment ด้านล่างถ้าต้องการให้ข้อมูลเก่าเข้าเกณฑ์ลบถาวรหลัง 30 วันด้วย
-- ============================================================
-- UPDATE appointments
-- SET deleted_at = COALESCE(deleted_at, NOW())
-- WHERE status IN ('cancelled', 'completed') AND deleted_at IS NULL;
