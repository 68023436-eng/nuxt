-- ============================================================
-- Migration: สร้างตาราง scan_history สำหรับบันทึกผลการตรวจสอบของ รปภ.
--
-- วิธีรัน:
--   psql "$DATABASE_URL" -f scripts/add_scan_history_table.sql
--   หรือรันผ่าน Supabase Dashboard > SQL Editor
--
-- ผลลัพธ์:
--   - สร้างตาราง scan_history (ถ้ายังไม่มี) + เพิ่มคอลัมน์ที่ขาด (ถ้าตารางเคยสร้างด้วย schema เก่า)
--   - บันทึกเฉพาะรายการที่ รปภ. ตรวจสอบจริง (สแกน QR / ค้นหาเบอร์โทร)
--   - ไม่กระทบตาราง appointments / ข้อมูลนัดหมายเดิม
--   - RLS เปิด + policy SELECT/INSERT อนุญาต (ให้แอปใช้งานผ่าน service key)
--
-- มigrations นี้รันกี่ครั้งก็ได้ (idempotent)
-- ============================================================

-- สร้างตาราง (ถ้ายังไม่มี) พร้อมคอลัมน์ทั้งหมดที่หน้า ประวัติการตรวจสอบ ใช้
CREATE TABLE IF NOT EXISTS public.scan_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  method TEXT NOT NULL CHECK (method IN ('qr', 'phone')),
  qr_token TEXT,
  phone_number TEXT,
  patient_name TEXT,
  appointment_id TEXT,
  result TEXT NOT NULL CHECK (result IN ('valid', 'invalid')),
  checked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- อัพเกรดตารางที่เคยสร้างด้วย schema เก่า (ยังไม่มีคอลัมน์ patient_name / appointment_id)
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.scan_history ADD COLUMN IF NOT EXISTS appointment_id TEXT;

-- index สำหรับหน้าประวัติของแต่ละ รปภ. (เรียงตามเวลาล่าสุด)
CREATE INDEX IF NOT EXISTS idx_scan_history_checked_by
  ON public.scan_history (checked_by, created_at DESC);

-- RLS + policy (ปลอดภัยและใช้งานผ่าน service key ของแอปได้)
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scan_history_select ON public.scan_history;
CREATE POLICY scan_history_select ON public.scan_history FOR SELECT USING (true);

DROP POLICY IF EXISTS scan_history_insert ON public.scan_history;
CREATE POLICY scan_history_insert ON public.scan_history FOR INSERT WITH CHECK (true);

-- ถ้าต้องการให้ setup_access.py รู้จักตารางนี้ด้วย (เมื่อรันครั้งถัดไป)
-- ให้เพิ่ม BLOCK ต่อไปนี้ลงใน PLANS ของ scripts/setup_access.py:
--   "scan_history": [
--       ("scan_history_select", "SELECT", "true", None),
--       ("scan_history_insert", "INSERT", None, "true"),
--   ],