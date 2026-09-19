<script setup lang="ts">
/**
 * MapsDirectionsButton
 * ปุ่มเปิด Google Maps นำทางไปยังจุดหมาย (จุดจอดรถ / อาคารคลินิก)
 * ใช้ target="_blank" เปิดในแท็บใหม่ (รองรับมือถือ: เปิดแอป Google Maps)
 *
 * รองรับการนำทาง 2 แบบ:
 *   1. พิกัด (coord: { lat, lng }) — แม่นยำที่สุด
 *   2. ข้อความ (destination) — fallback เมื่อไม่มีพิกัด
 */
import { buildGoogleMapsDirectionsUrl, type GeoCoord } from '~/constants/clinic'

const props = withDefaults(
  defineProps<{
    /** ข้อความปลายทาง (เช่น ชื่ออาคารจอดรถ) — fallback เมื่อไม่มี coord */
    destination?: string
    /** พิกัดจุดหมาย { lat, lng } — ถ้ามีจะใช้ค่านี้นำทาง (แม่นกว่าข้อความ) */
    coord?: GeoCoord | null
    /** ข้อความบนปุ่ม */
    label: string
    /** ไอคอน (emoji) แสดงนำหน้าข้อความ */
    icon?: string
  }>(),
  {
    destination: '',
    coord: null,
    icon: '📍',
  },
)

const mapsUrl = computed(() => buildGoogleMapsDirectionsUrl(props.destination, props.coord))
</script>

<template>
  <a
    :href="mapsUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-2.5 tw-rounded-xl tw-text-sm tw-font-semibold tw-text-white tw-bg-emerald-600 hover:tw-bg-emerald-700 tw-shadow-sm tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-emerald-400"
  >
    <span aria-hidden="true">{{ icon }}</span>
    <span>{{ label }}</span>
  </a>
</template>