<template>
  <div class="tw-max-w-60 tw-h-auto tw-p-5 tw-shadow-2xl tw-rounded-xl tw-items-center">
    <!-- โลโก้ (แนะนำเปลี่ยน path จาก ../public/... เป็น /... ตรงๆ) -->
    <div>
      <button @click="goTo('index')"><img src="/pic/channels4_profile.png" alt="logo" class="tw-max-h-40 tw-max-w-40" /></button>
    </div>
    <!-- เมนูทั้ง 3 ปุ่ม: ผูก @click เรียกใช้ฟังก์ชัน goTo -->
    <div class="tw-grid-cols-3 tw-mt-20">
      <button @click="goTo('appointment')" class="tw-p-3 tw-m-5 tw-w-40 tw-border-b tw-border-slate-300 hover:tw-bg-slate-100">
        ใบนัด
      </button>
      <button @click="goTo('form')" class="tw-p-3 tw-m-5 tw-w-40 tw-border-b tw-border-slate-300 hover:tw-bg-slate-100">
        กรอกข้อมูล
      </button>
      <button @click="goTo('history')" class="tw-p-3 tw-m-5 tw-w-40 tw-border-b tw-border-slate-300 hover:tw-bg-slate-100">
        ประวัติ
      </button>
    </div>

    <!-- ส่วนโปรไฟล์และปุ่ม Logout -->
    <div class="tw-flex tw-items-center tw-max-w-auto tw-bg-slate-300 tw-p-3 tw-mt-48 tw-rounded-xl">
      <div>
        <!-- ผูกรูปโปรไฟล์จากตัวแปร userAvatar -->
        <img :src="userAvatar" alt="avatar" class="tw-h-auto tw-w-auto tw-rounded-full object-cover" />
      </div>

      <!-- แสดงชื่อจากตัวแปร userName -->
      <div class="tw-mx-3 font-medium">{{ userName }}</div>

      <!-- ปุ่มไอคอน Logout: เพิ่ม cursor-pointer และผูก @click="handleLogout" -->
      <div @click="handleLogout" class=" tw-cursor-pointer hover:opacity-75 transition">
        <svg width="40px" height="40px" viewBox="-3.36 -3.36 30.72 30.72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g id="SVGRepo_bgCarrier" stroke-width="0"/>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
          <g id="SVGRepo_iconCarrier">
            <path d="M21 12L13 12" stroke="#ff4013" stroke-width="2.008" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18 15L20.913 12.087V12.087C20.961 12.039 20.961 11.961 20.913 11.913V11.913L18 9" stroke="#ff4013" stroke-width="2.008" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 5V4.5V4.5C16 3.67157 15.3284 3 14.5 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H14.5C15.3284 21 16 20.3284 16 19.5V19.5V19" stroke="#ff4013" stroke-width="2.008" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// ดึงตัวช่วยจัดการเส้นทางของ Nuxt และ Supabase Client
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// ตัวแปรเก็บข้อมูลผู้ใช้งาน (ถ้ามีข้อมูลใน Supabase จะดึงมาใช้ ถ้าไม่มีจะใช้ค่าเริ่มต้น)
const userName = ref(user.value?.user_metadata?.full_name || 'Somchai')
const userAvatar = ref(user.value?.user_metadata?.avatar_url || '/pic/istock-633114032.jpeg')

// ฟังก์ชันกดเปลี่ยนหน้าตามเมนู
const goTo = (pageName) => {
  // ใส่ path หน้าของแต่ละเมนูตามโครงสร้างโฟลเดอร์ pages/ ของโปรเจกต์
  const routes = {
    appointment: '/appointments',  // หน้าใบนัด
    form: '/patient-form',         // หน้ากรอกข้อมูล
    history: '/history',            // หน้าประวัติ
    index: '/index'
  }

  if (routes[pageName]) {
    navigateTo(routes[pageName])
  }
}

// ฟังก์ชันออกจากระบบ (Logout)
const handleLogout = async () => {
  const confirmLogout = confirm('ต้องการออกจากระบบใช่หรือไม่?')
  if (!confirmLogout) return

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    // ล็อกเอาต์สำเร็จ ให้ดีดกลับไปหน้า Login
    navigateTo('/login')
  } catch (err) {
    console.error('Logout error:', err.message)
    alert('เกิดข้อผิดพลาดในการออกจากระบบ')
  }
}
</script>