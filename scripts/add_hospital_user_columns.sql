-- ===================================================
-- Migration: เพิ่มคอลัมน์ข้อมูลเจ้าหน้าที่ ลงตาราง hospital_user
-- ===================================================

ALTER TABLE hospital_user 
  -- ปรับเป็น VARCHAR(20) เพื่อรองรับฟอร์แมตเบอร์โทรที่มีขีดหรือรหัสประเทศ
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) DEFAULT NULL,
  
  -- อีเมลสำหรับติดต่อหรือแจ้งเตือน
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL,
  
  -- แฮชรหัสผ่าน (คงไว้เผื่อระบบเก่า หากย้ายไป Supabase Auth เต็มตัวสามารถตัดออกได้)
  ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL,
  
  -- สถานะการใช้งานบัญชี (เปิดใช้งานเป็นค่าเริ่มต้น)
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- สร้าง Index ให้ phone_number เพื่อให้ตอนเช็กเบอร์ใน session.post.ts ค้นหาได้เร็ว
CREATE INDEX IF NOT EXISTS idx_hospital_user_phone 
ON hospital_user(phone_number);