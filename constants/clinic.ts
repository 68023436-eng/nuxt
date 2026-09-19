/**
 * Clinic-related constants shared between client and server
 *
 * ใช้ประกอบการแสดง QR Code / ปุ่มนำทาง (Google Maps) ในหน้ารายละเอียดนัดหมาย
 * รองรับการนำทางแบบพิกัด (lat, lng) แยกสำหรับจุดจอดรถและอาคารคลินิก
 */

export interface GeoCoord {
  lat: number
  lng: number
}

/** ชื่อคลินิก (ใช้ประกอบการสร้าง destination ในการนำทาง) */
export const CLINIC_NAME = 'PremiumClinic'

/** ที่อยู่ของคลินิก (fallback เมื่อไม่มีพิกัด) */
export const CLINIC_ADDRESS = process.env.NUXT_PUBLIC_CLINIC_ADDRESS || '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110'

/** บริเวณ/ย่าน เพื่อให้ Maps หาเจอแม่นขึ้น (เช่น ป้ายชื่ออาคาร) */
export const CLINIC_AREA = 'กรุงเทพมหานคร'

/** พิกัดจุดจอดรถ (.latitude, .longitude) override ด้วย env ได้ */
export const PARKING_COORD: GeoCoord = {
  lat: Number(process.env.NUXT_PUBLIC_PARKING_LAT) || 18.8520317,
  lng: Number(process.env.NUXT_PUBLIC_PARKING_LNG) || 98.9667096,
}

/** พิกัดอาคารคลินิก override ด้วย env ได้ */
export const CLINIC_COORD: GeoCoord = {
  lat: Number(process.env.NUXT_PUBLIC_CLINIC_LAT) || 18.851417,
  lng: Number(process.env.NUXT_PUBLIC_CLINIC_LNG) || 98.967750,
}

/**
 * สร้าง URL เปิด Google Maps พร้อมเริ่มนำทาง (directions)
 * รองรับ 2 โหมด:
 *   1. พิกัด (lat, lng) — แม่นยำที่สุด ใช้เมื่อมีค่า lat/lng
 *   2. ข้อความ (destination) — fallback เมื่อไม่มีพิกัด
 */
export const buildGoogleMapsDirectionsUrl = (
  destination?: string,
  coord?: GeoCoord | null,
): string => {
  // ถ้ามีพิกัด ใช้พิกัดเลย (แม่นกว่า text search)
  if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${coord.lat},${coord.lng}`
  }
  // fallback เป็นข้อความค้นหา
  const query = (destination || '').trim() || CLINIC_ADDRESS
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
}

/** สร้าง destination สำหรับจุดจอดรถ ตามอาคารที่จองไว้ในระบบ */
export const buildParkingDestination = (buildingName: string | null | undefined): string => {
  if (buildingName) return `${buildingName} ${CLINIC_NAME} ${CLINIC_AREA}`.trim()
  return `${CLINIC_NAME} จุดจอดรถ ${CLINIC_AREA}`.trim()
}

/** สร้าง destination สำหรับอาคารคลินิก */
export const buildClinicDestination = (): string => `${CLINIC_NAME} ${CLINIC_ADDRESS}`.trim()

/** URL นำทางไปยังอาคารคลินิก (ใช้พิกัดคลินิก) */
export const CLINIC_DIRECTIONS_URL = buildGoogleMapsDirectionsUrl(buildClinicDestination(), CLINIC_COORD)

/** URL นำทางไปจุดจอดรถ (fallback — ใช้พิกัดจุดจอดรถ) */
export const PARKING_DIRECTIONS_URL = buildGoogleMapsDirectionsUrl(buildParkingDestination(null), PARKING_COORD)