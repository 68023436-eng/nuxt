<template>
  <div class="tw-max-w-60 tw-h-screen tw-sticky tw-top-0 tw-p-5 tw-shadow-2xl tw-rounded-xl tw-flex tw-flex-col tw-justify-between tw-bg-white">
    <!-- ส่วนบน: โลโก้ และ เมนูนำทาง -->
    <div>
      <!-- โลโก้โรงพยาบาล -->
      <div class="tw-flex tw-justify-center">
        <img 
          @click="goTo('main')" 
          src="/pic/logo.png" 
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
          ใบนัดหมาย
        </button>
        <button 
          v-if="canCreate"
          @click="goTo('form')" 
          class="tw-p-3 tw-w-44 tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
        >
          กรอกข้อมูล
        </button>
        <button 
          @click="goTo('history')" 
          class="tw-p-3 tw-w-44 tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
        >
          ประวัติ
        </button>
      </div>
    </div>      

    <!-- ส่วนล่าง: ผู้ใช้งานที่เข้าสู่ระบบ -->
    <div class="tw-mt-6 tw-border-t tw-border-slate-200 tw-pt-4">
      <div class="tw-flex tw-items-center tw-gap-3">
        <div class="tw-w-10 tw-h-10 tw-rounded-full tw-bg-emerald-600 tw-text-white tw-flex tw-items-center tw-justify-center tw-font-bold tw-flex-shrink-0">
          {{ (session?.full_name || '?').charAt(0) }}
        </div>
        <div class="tw-min-w-0 tw-flex-1">
          <p class="tw-text-sm tw-font-semibold tw-text-gray-800 tw-truncate">{{ session?.full_name || 'ไม่ระบุชื่อ' }}</p>
          <p class="tw-text-xs tw-text-emerald-600 tw-font-medium">{{ roleLabel }}</p>
        </div>
      </div>
      <button
        @click="handleLogout"
        class="tw-mt-3 tw-w-full tw-text-left tw-text-sm tw-text-red-500 hover:tw-bg-red-50 tw-p-2 tw-rounded-lg tw-transition tw-font-medium"
      >
        ออกจากระบบ ⏻
      </button>
    </div>
  </div>
</template>

<script setup>
// ============================================================
// Navigation
// ============================================================

const { session, roleLabel, canCreate, refresh, logout } = useSession()

onMounted(() => {
  refresh()
})

const handleLogout = async () => {
  await logout()
  navigateTo('/access')
}

const goTo = (pageName) => {
  const routes = {
    appointment: '/appointments',
    form: '/patient-form',
    history: '/history',
    main: '/',
  }

  if (routes[pageName]) {
    navigateTo(routes[pageName])
  }
}
</script>