/**
 * โหลด session ก่อน mount หน้าเว็บ (client เท่านั้น)
 * - แก้ปัญหา race: onMounted ของแต่ละ page ตรวจสิทธิ์โดย session ยังไม่โหลด
 *   (เช่น patient-form redirect เจ้าหน้าที่หนีหน้าโดยมิได้ตั้งใจ)
 */
export default defineNuxtPlugin(async () => {
  const { refresh } = useSession()
  await refresh()
})