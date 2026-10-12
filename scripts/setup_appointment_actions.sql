-- ===================================================
-- Function กลางสำหรับ การลบ (soft-delete) และกู้คืน นัดหมาย
-- ให้โค้ดฝั่ง server เรียกผ่าน rpc แทนการเขียน UPDATE ซ้ำหลายแห่ง
-- ===================================================

-- ---------------------------------------------------
-- 1) set_appointment_cancelled(ids): soft-delete เป็นกลุ่ม
--    ตั้ง status='cancelled' + deleted_at=now (ถ้ายังไม่มี)
--    คืน appointment_id + deleted_at ของแถวที่เปลี่ยน
--    (ทำงานเดียวกันกับเดิม: ใช้กับลบรายเดียว และลบแบบกลุ่ม)
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_appointment_cancelled(p_ids BIGINT[])
RETURNS TABLE(appointment_id BIGINT, deleted_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    UPDATE public.appointments
       SET status = 'cancelled',
           deleted_at = COALESCE(public.appointments.deleted_at, NOW())
     WHERE public.appointments.appointment_id = ANY(p_ids)
    RETURNING public.appointments.appointment_id::BIGINT, public.appointments.deleted_at;
END;
$$;

-- ---------------------------------------------------
-- 2) restore_appointments(ids): กู้คืนจากประวัติ
--    ตั้ง status='backup' + ล้าง deleted_at
--    คืน appointment_id ของแถวที่กู้คืน
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_appointments(p_ids BIGINT[])
RETURNS TABLE(appointment_id BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    UPDATE public.appointments
       SET status = 'backup',
           deleted_at = NULL
     WHERE public.appointments.appointment_id = ANY(p_ids)
    RETURNING public.appointments.appointment_id::BIGINT;
END;
$$;