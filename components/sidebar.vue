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
  </div>
</template>

<script setup>
// ============================================================
// Navigation
// ============================================================

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