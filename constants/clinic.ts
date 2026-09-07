/**
 * Clinic-related constants shared between client and server
 *
 * ใช้ประกอบการแสดง QR Code / ปุ่มนำทาง (Google Maps) ในหน้ารายละเอียดนัดหมาย
 * กรณีคลินิกเปลี่ยนที่ตั้ง ให้แก้ค่า CLINIC_ADDRESS / CLINIC_AREA ด้านล่าง
 * (หรือ override ด้วย env: NUXT_PUBLIC_CLINIC_ADDRESS)
 */

/** ชื่อคลินิก (ใช้ประกอบการสร้าง destination ในการนำทาง) */
export const CLINIC_NAME = 'PremiumClinic'

/** ที่อยู่ของคลินิก ใช้เป็น destination เริ่มต้นในการนำทาง / จุดสิ้นสุดของอาคารคลินิก */
export const CLINIC_ADDRESS = process.env.NUXT_PUBLIC_CLINIC_ADDRESS || '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110'

/** บริเวณ/ย่าน เพื่อให้ Maps หาเจอแม่นขึ้น (เช่น ป้ายชื่ออาคาร) */
export const CLINIC_AREA = 'กรุงเทพมหานคร'

/** สร้าง URL เปิด Google Maps พร้อมเริ่มนำทาง (directions) ไปยัง destination */
export const buildGoogleMapsDirectionsUrl = (destination: string): string => {
  const query = destination.trim() || CLINIC_ADDRESS
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
}

/** สร้าง destination สำหรับจุดจอดรถ ตามอาคารที่จองไว้ในระบบ */
export const buildParkingDestination = (buildingName: string | null | undefined): string => {
  if (buildingName) return `${buildingName} ${CLINIC_NAME} ${CLINIC_AREA}`.trim()
  return `${CLINIC_NAME} จุดจอดรถ ${CLINIC_AREA}`.trim()
}

/** สร้าง destination สำหรับอาคารคลินิก */
export const buildClinicDestination = (): string => `${CLINIC_NAME} ${CLINIC_ADDRESS}`.trim()

/** URL นำทางไปยังอาคารคลินิก */
export const CLINIC_DIRECTIONS_URL = buildGoogleMapsDirectionsUrl(buildClinicDestination())

/** URL นำทางไปจุดจอดรถ (fallback — ปกติใช้ตาม building_name ของแต่ละรายการ) */
export const PARKING_DIRECTIONS_URL = buildGoogleMapsDirectionsUrl(buildParkingDestination(null))