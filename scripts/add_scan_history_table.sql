-- ===================================================
-- Migration: สร้างตาราง scan_history สำหรับบันทึกผลการตรวจสอบของ รปภ.
-- ===================================================

-- 1. สร้างตารางบันทึกประวัติการสแกน
CREATE TABLE IF NOT EXISTS public.scan_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  method TEXT NOT NULL CHECK (method IN ('qr', 'phone')),
  qr_token TEXT,
  phone_number VARCHAR(20),
  patient_name TEXT,
  appointment_id BIGINT, -- ปรับเป็น BIGINT ให้ตรงกับ numericId ของตาราง appointments
  result TEXT NOT NULL CHECK (result IN ('valid', 'invalid')),
  checked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. เผื่อกรณีตารางเดิมเคยถูกสร้างไว้ก่อนหน้านี้แล้วขาดคอลัมน์ (รวบคำสั่งเดียว)
ALTER TABLE public.scan_history 
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS appointment_id BIGINT;

-- 3. สารบัญค้นหาสำหรับหน้าประวัติของ รปภ. แต่ละคน
CREATE INDEX IF NOT EXISTS idx_scan_history_checked_by 
ON public.scan_history (checked_by, created_at DESC);

-- 4. สารบัญค้นหาตามเวลานัดหมาย (เผื่อกดดูประวัติย้อนหลังจากเลขคิว)
CREATE INDEX IF NOT EXISTS idx_scan_history_appointment_id 
ON public.scan_history (appointment_id);

-- 5. ระบบความปลอดภัย Row Level Security (RLS)
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- ล้าง Policy เก่าก่อนสร้างใหม่
DROP POLICY IF EXISTS scan_history_select ON public.scan_history;
DROP POLICY IF EXISTS scan_history_insert ON public.scan_history;

-- แนะนำ: ถ้าเรียกผ่าน Nuxt Server API โดยใช้ Service Role Key จะข้าม RLS ได้อยู่แล้ว
-- แต่ถ้ายิงตรงจาก Frontend ควรจำกัดให้เฉพาะคนที่ล็อกอินแล้วเท่านั้นที่อ่าน/เขียนได้
CREATE POLICY scan_history_select 
ON public.scan_history 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY scan_history_insert 
ON public.scan_history 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- ===================================================
-- Function: บันทึกผลการตรวจสอบของ รปภ. ลง scan_history
-- (ใช้แทนโค้ด insert + ตรวจซ้ำใน server — รูปแบบ function ใน DB)
--  - ถ้ามีรายการเดียวกันใน 10 วินาทีหลัง → คืน NULL (ข้าม ไม่บันทึกซ้ำ)
--  - สำเร็จ → คืน id แถวใหม่
-- ===================================================
CREATE OR REPLACE FUNCTION public.log_scan_attempt(
  p_method TEXT,
  p_qr_token TEXT,
  p_phone_number TEXT,
  p_patient_name TEXT,
  p_appointment_id BIGINT,
  p_result TEXT,
  p_checked_by TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id BIGINT;
  v_new_id BIGINT;
BEGIN
  SELECT id INTO v_existing_id
    FROM public.scan_history
   WHERE method = p_method
     AND checked_by = p_checked_by
     AND result = p_result
     AND created_at >= NOW() - INTERVAL '10 seconds'
     AND CASE WHEN p_method = 'qr' THEN qr_token = p_qr_token ELSE phone_number = p_phone_number END
   LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.scan_history
    (method, qr_token, phone_number, patient_name, appointment_id, result, checked_by)
  VALUES
    (p_method, p_qr_token, p_phone_number, p_patient_name, p_appointment_id, p_result, p_checked_by)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;