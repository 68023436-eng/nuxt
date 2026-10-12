-- ===================================================
-- Migration: เพิ่มคอลัมน์ deleted_at สำหรับระบบ Soft-Delete + Auto-Purge
-- ===================================================

-- 1. เพิ่มคอลัมน์ deleted_at (กระชับและปลอดภัย ไม่ต้องเปิดบล็อก DO ให้ซับซ้อน)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. สร้าง Partial Index ตัวเดียว เพื่อใช้เร่งความเร็วตอนรัน Auto-Purge (ลบข้อมูลเก่า > 30 วัน)
-- ไม่สร้าง Full Index เพื่อลดภาระการเขียนข้อมูลตอนคนไข้กดนัดหมายใหม่
CREATE INDEX IF NOT EXISTS idx_appointments_purge 
ON appointments(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- 3. (Optional) ปรับสถานะรายการที่ยกเลิกไปแล้วในอดีต ให้เริ่มนับถอยหลัง 30 วัน
-- หมายเหตุ: ห้ามใส่ 'completed' เด็ดขาดเพื่อรักษาประวัติการรักษา
-- UPDATE appointments
-- SET deleted_at = NOW()
-- WHERE status = 'cancelled' AND deleted_at IS NULL;

-- ===================================================
-- Trigger: ตี deleted_at อัตโนมัติเมื่อสถานะกลายเป็น 'cancelled'
-- (Soft-delete อัตโนมัติแม้โค้ดแอปส่งแค่ status มา แล้วลืมส่ง deleted_at)
-- ===================================================
CREATE OR REPLACE FUNCTION public.appointments_set_deleted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND NEW.deleted_at IS NULL THEN
    NEW.deleted_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointments_soft_delete ON public.appointments;
CREATE TRIGGER trg_appointments_soft_delete
  BEFORE UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.appointments_set_deleted_at();