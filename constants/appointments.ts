/**
 * Appointment-related constants shared between client and server
 */

/** จำนวนวันที่เก็บข้อมูลหลัง soft-delete ก่อนลบถาวร */
export const RETENTION_DAYS = 30

/** ช่วงเวลาที่อนุญาตให้นัดหมาย */
export const ALLOWED_TIME_SLOTS = ['09:00 - 12:00', '13:00 - 16:00'] as const
