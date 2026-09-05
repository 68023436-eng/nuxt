<template>
  <div class="tw-max-w-60 tw-h-screen tw-sticky tw-top-0 tw-p-5 tw-shadow-2xl tw-rounded-xl tw-flex tw-flex-col tw-justify-between tw-bg-white">
    <!-- ส่วนบน: โลโก้ และ เมนูนำทาง -->
    <div>
      <!-- โลโก้โรงพยาบาล -->
      <div class="tw-flex tw-justify-center">
        <img 
          @click="goTo('main')" 
          src="/public/pic/logo.png" 
          alt="logo" 
          class="tw-max-h-32 tw-max-w-32 tw-cursor-pointer hover:tw-opacity-80 tw-transition" 
        />
      </div>

      <!-- เมนูนำทาง -->
      <div class="tw-flex tw-flex-col tw-items-center tw-mt-10 tw-gap-2">
        <button 
          @click="goTo('appointment')" 
          class="tw-p-3 tw-w-44 tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
        >
          📋 ใบนัดหมาย
        </button>
        <button 
          @click="goTo('form')" 
          class="tw-p-3 tw-w-44 tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
        >
          ✍️ กรอกข้อมูล
        </button>
        <button 
          @click="goTo('history')" 
          class="tw-p-3 tw-w-44 tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
        >
          🕒 ประวัติ
        </button>
      </div>
    </div>

    <!-- ส่วนล่าง: ใช้ ClientOnly เพื่อป้องกันปัญหา SSR ทำให้ UI ไม่ยอมอัปเดต -->
    <ClientOnly>
      <div class="tw-w-full">
        <!-- กรณีที่ 1: ล็อกอินแล้ว -> โชว์รูป + ชื่อ + Role Badge + ปุ่ม Logout -->
        <div 
          v-if="user" 
          class="tw-flex tw-items-center tw-justify-between tw-bg-slate-100 tw-p-3 tw-rounded-xl tw-border tw-border-slate-200"
        >
          <!-- รูปโปรไฟล์ -->
          <div class="tw-w-10 tw-h-10 tw-flex-shrink-0">
            <img 
              :src="userAvatar" 
              alt="avatar" 
              class="tw-w-10 tw-h-10 tw-rounded-full tw-object-cover tw-border tw-border-white tw-shadow-sm" 
            />
          </div>

          <!-- รายละเอียดชื่อ และ Role Badge -->
          <div class="tw-mx-2 tw-flex-1 tw-min-w-0">
            <p class="tw-text-xs tw-font-bold tw-text-gray-800 tw-truncate" :title="displayName">
              {{ displayName }}
            </p>
            
            <!-- Badge แสดงบทบาท (Role) -->
            <div class="tw-mt-1 tw-flex tw-items-center tw-gap-1">
              <span 
                :class="roleBadgeStyle.badgeClass"
                class="tw-text-[10px] tw-font-semibold tw-px-2 tw-py-0.5 tw-rounded-md tw-inline-flex tw-items-center tw-gap-1"
              >
                <span>{{ roleBadgeStyle.icon }}</span>
                <span>{{ roleBadgeStyle.label }}</span>
              </span>
            </div>
          </div>

          <!-- ปุ่มไอคอน Logout -->
          <button 
            @click="handleLogout" 
            title="ออกจากระบบ" 
            class="tw-cursor-pointer hover:tw-opacity-75 tw-transition tw-flex-shrink-0 tw-p-1"
          >
            <svg width="24px" height="24px" viewBox="-3.36 -3.36 30.72 30.72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="SVGRepo_bgCarrier" stroke-width="0"/>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
              <g id="SVGRepo_iconCarrier">
                <path d="M21 12L13 12" stroke="#ff4013" stroke-width="2.008" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 15L20.913 12.087V12.087C20.961 12.039 20.961 11.961 20.913 11.913V11.913L18 9" stroke="#ff4013" stroke-width="2.008" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 5V4.5V4.5C16 3.67157 15.3284 3 14.5 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H14.5C15.3284 21 16 20.3284 16 19.5V19.5V19" stroke="#ff4013" stroke-width="2.008" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
            </svg>
          </button>
        </div>

        <!-- กรณีที่ 2: ยังไม่ได้ล็อกอิน -> โชว์ปุ่มไปหน้าเข้าสู่ระบบ -->
        <div v-else>
          <button 
            @click="goTo('auth')" 
            class="tw-w-full tw-py-2.5 tw-px-4 tw-bg-amber-500 hover:tw-bg-amber-600 tw-text-white tw-font-semibold tw-text-sm tw-rounded-xl tw-shadow-sm tw-transition tw-flex tw-items-center tw-justify-center tw-gap-2"
          >
            <span>🔑</span> เข้าสู่ระบบ
          </button>
        </div>
      </div>

      <!-- ข้อความ Placeholder ตอนกำลังโหลด SSR -->
      <template #fallback>
        <div class="tw-w-full tw-h-12 tw-bg-slate-100 tw-rounded-xl tw-animate-pulse"></div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// State เก็บข้อมูลโปรไฟล์จากตาราง hospital_user
const dbfull_name = ref('')
const dbrole = ref('')

// ฟังก์ชันดึง full_name และ role จากตาราง hospital_user ใน Supabase
const fetchUserProfile = async (userId) => {
  const targetId = userId || user.value?.id
  if (!targetId) {
    dbFullName.value = ''
    dbRole.value = ''
    return
  }

  try {
    const { data, error } = await supabase
      .from('hospital_user')
      .select('full_name, role')
      .eq('user_id', targetId)
      .maybeSingle()

    if (data) {
      dbFullName.value = data.full_name || ''
      dbRole.value = data.role || ''
    }
  } catch (err) {
    console.error('ดึงข้อมูล hospital_user ไม่สำเร็จ:', err)
  }
}

// ตรวจสอบสถานะ Auth ทันทีที่โหลดเข้าเบราว์เซอร์
onMounted(async () => {
  // 1. ดึง session สดๆ จาก Supabase ทันที
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    fetchUserProfile(session.user.id)
  }

  // 2. ดักฟัง Event เวลา Login / Logout / Token Refresh แบบ Real-time
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      fetchUserProfile(session.user.id)
    } else {
      dbFullName.value = ''
      dbRole.value = ''
    }
  })
})

// แสดงชื่อ: ชื่อในตาราง DB -> Metadata -> หน้าอีเมล
const displayName = computed(() => {
  if (!user.value) return 'ผู้ใช้งานทั่วไป'
  return (
    dbFullName.value ||
    user.value.user_metadata?.full_name ||
    user.value.email?.split('@')[0] ||
    'ผู้ใช้งาน'
  )
})

// รูปโปรไฟล์
const userAvatar = computed(() => {
  return (
    user.value?.user_metadata?.avatar_url || 
    '/pic/istock-633114032.jpeg'
  )
})

// ปรับสีและป้ายกำกับ Role
const roleBadgeStyle = computed(() => {
  const currentRole = (dbRole.value || user.value?.user_metadata?.role || 'staff').toLowerCase()

  const roleMap = {
    admin: {
      label: 'ผู้ดูแลระบบ',
      icon: '🛡️',
      badgeClass: 'tw-bg-rose-100 tw-text-rose-700 tw-border tw-border-rose-200'
    },
    doctor: {
      label: 'แพทย์',
      icon: '🩺',
      badgeClass: 'tw-bg-sky-100 tw-text-sky-700 tw-border tw-border-sky-200'
    },
    nurse: {
      label: 'พยาบาล',
      icon: '💉',
      badgeClass: 'tw-bg-teal-100 tw-text-teal-700 tw-border tw-border-teal-200'
    },
    staff: {
      label: 'เจ้าหน้าที่ รปภ.',
      icon: '💼',
      badgeClass: 'tw-bg-amber-100 tw-text-amber-700 tw-border tw-border-amber-200'
    },
    patient: {
      label: 'ผู้ป่วย / คนไข้',
      icon: '👤',
      badgeClass: 'tw-bg-emerald-100 tw-text-emerald-700 tw-border tw-border-emerald-200'
    }
  }

  return roleMap[currentRole] || {
    label: currentRole,
    icon: '🏷️',
    badgeClass: 'tw-bg-slate-200 tw-text-slate-700'
  }
})

// นำทางหน้าต่างๆ
const goTo = (pageName) => {
  const routes = {
    appointment: '/appointments',
    form: '/patient-form',
    history: '/history',
    main: '/',
    auth: '/auth'
  }

  if (routes[pageName]) {
    navigateTo(routes[pageName])
  }
}

// ออกจากระบบ
const handleLogout = async () => {
  const confirmLogout = confirm('ต้องการออกจากระบบใช่หรือไม่?')
  if (!confirmLogout) return

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    dbFullName.value = ''
    dbRole.value = ''
    navigateTo('/auth')
  } catch (err) {
    console.error('Logout error:', err.message)
    navigateTo('/auth')
  }
}
</script>