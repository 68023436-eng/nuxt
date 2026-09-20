<template>
  <div>
    <!-- ปุ่ม Hamburger สำหรับ Mobile (แสดงเฉพาะมือถือ ซ่อนเมื่ออยู่บน Tablet/PC) -->
    <button
      @click="toggleSidebar"
      type="button"
      class="tw-fixed tw-top-4 tw-left-4 tw-z-40 md:tw-hidden tw-p-2.5 tw-rounded-xl tw-bg-white tw-shadow-md tw-border tw-border-slate-100 tw-text-gray-700 hover:tw-bg-slate-50 focus:tw-outline-none"
      aria-label="Toggle Menu"
    >
      <svg class="tw-w-6 tw-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- ฉากหลังสีดำโปร่งแสง (Backdrop) บนมือถือ -->
    <div
      v-if="isOpen"
      @click="closeSidebar"
      class="tw-fixed tw-inset-0 tw-z-40 tw-bg-slate-900/40 tw-backdrop-blur-[2px] md:tw-hidden tw-transition-opacity"
    />

    <!-- ตัวแถบ Sidebar -->
    <aside
      :class="[
        // ขนาดและตำแหน่งพื้นฐาน
        'tw-w-64 tw-h-screen tw-p-5 tw-bg-white tw-flex tw-flex-col tw-justify-between tw-overflow-y-auto tw-z-50',

        // บนมือถือ (< md): เป็น Drawer สไลด์เปิด-ปิด
        'tw-fixed tw-inset-y-0 tw-left-0 tw-transition-transform tw-duration-300 tw-ease-in-out',
        isOpen ? 'tw-translate-x-0 tw-shadow-2xl' : '-tw-translate-x-full',

        // บนจอคอม/iPad (md ขึ้นไป): ตรึงอยู่กับที่ ปิด transition/transform ทั้งหมด (แก้บั๊กเงากระตุกตอนรีเฟรช)
        'md:tw-sticky md:tw-top-0 md:tw-transform-none md:tw-transition-none md:tw-shadow-xl md:tw-rounded-r-2xl'
      ]"
    >
      <!-- ส่วนบน: ปุ่มปิด (บนมือถือ), โลโก้ และเมนูนำทาง -->
      <div>
        <!-- ปุ่มปิดเมนูบนมือถือ (กากบาท) -->
        <div class="tw-flex tw-justify-end md:tw-hidden tw-mb-2">
          <button
            @click="closeSidebar"
            type="button"
            class="tw-p-1.5 tw-rounded-lg tw-text-gray-400 hover:tw-text-gray-600 hover:tw-bg-slate-100"
          >
            <svg class="tw-w-5 tw-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- โลโก้โรงพยาบาล -->
        <div class="tw-flex tw-justify-center">
          <img 
            @click="goTo('main')" 
            src="/pic/logo.png" 
            alt="logo" 
            class="tw-max-h-28 tw-max-w-28 md:tw-max-h-32 md:tw-max-w-32 tw-cursor-pointer hover:tw-opacity-80 tw-transition" 
          />
        </div>

        <!-- ปุ่มเปลี่ยนภาษา -->
        <div class="tw-flex tw-justify-center tw-mt-4 md:tw-mt-5">
          <LanguageSwitcher />
        </div>

        <!-- เมนูนำทาง -->
        <div class="tw-flex tw-flex-col tw-items-center tw-mt-6 tw-gap-2">
          <button 
            v-if="isGuard"
            @click="goTo('verify')" 
            class="tw-p-3 tw-w-full tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
          >
            {{ $t('sidebar.scan') }}
          </button>
          <button 
            v-if="!isGuard"
            @click="goTo('appointment')" 
            class="tw-p-3 tw-w-full tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
          >
            {{ $t('sidebar.appointment') }}
          </button>
          <button 
            v-if="canCreate && !isGuard && !asAdmin"
            @click="goTo('form')" 
            class="tw-p-3 tw-w-full tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
          >
            {{ $t('sidebar.form') }}
          </button>
          <button 
            @click="goTo('history')" 
            class="tw-p-3 tw-w-full tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
          >
            {{ $t('sidebar.history') }}
          </button>
          <button 
            v-if="asAdmin"
            @click="goTo('manageStaff')" 
            class="tw-p-3 tw-w-full tw-text-left tw-border-b tw-border-slate-200 hover:tw-bg-slate-50 tw-rounded-lg tw-transition tw-font-medium tw-text-gray-700"
          >
            {{ $t('sidebar.manageStaff') }}
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
            <p class="tw-text-sm tw-font-semibold tw-text-gray-800 tw-truncate">{{ session?.full_name || $t('sidebar.unknownName') }}</p>
            <p class="tw-text-xs tw-text-emerald-600 tw-font-medium">{{ roleLabel }}</p>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="tw-mt-3 tw-w-full tw-text-left tw-text-sm tw-text-red-500 hover:tw-bg-red-50 tw-p-2 tw-rounded-lg tw-transition tw-font-medium"
        >
          {{ $t('sidebar.logout') }} ⏻
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
// ============================================================
// Responsive & Navigation
// ============================================================

const isOpen = ref(false)
const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}
const closeSidebar = () => {
  isOpen.value = false
}

const { session, role, roleLabel, canCreate, asAdmin, refresh, logout } = useSession()

const isGuard = computed(() => role.value === 'Security_guard')

onMounted(() => {
  refresh()
})

const handleLogout = async () => {
  await logout()
  closeSidebar()
  navigateTo('/access')
}

const goTo = (pageName) => {
  // สั่งปิดเมนู Drawer เสมอเมื่อผู้ใช้กดเลือกหน้าบนมือถือ
  closeSidebar()

  const routes = {
    verify: '/verify',
    appointment: '/appointments',
    form: '/patient-form',
    history: '/history',
    manageStaff: '/admin/staff',
    main: '/',
  }

  // รปภ. ไปหน้าแรก → ให้ไปที่หน้าสแกน QR
  if (pageName === 'main' && isGuard.value) {
    navigateTo('/verify')
    return
  }

  if (routes[pageName]) {
    navigateTo(routes[pageName])
  }
}
</script>