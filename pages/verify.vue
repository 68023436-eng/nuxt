<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- แถบนำทางด้านข้าง -->
    <Sidebar />

    <!-- พื้นที่เนื้อหาหลัก -->
    <main class="tw-flex-1 tw-min-w-0 tw-p-4 sm:tw-p-6 md:tw-p-8 tw-pt-16 md:tw-pt-8">
      
      <!-- 1. กรณีไม่มีสิทธิ์เข้าถึง (Access Denied) -->
      <div v-if="!isGuard" class="tw-max-w-md tw-mx-auto tw-mt-12 sm:tw-mt-20 tw-text-center tw-bg-white tw-p-6 sm:tw-p-8 tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200">
        <div class="tw-w-16 sm:tw-w-20 tw-h-16 sm:tw-h-20 tw-bg-red-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
          <span class="tw-text-3xl sm:tw-text-4xl">🔒</span>
        </div>
        <h2 class="tw-text-lg sm:tw-text-xl tw-font-bold tw-text-gray-800">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mt-2">หน้านี้สำหรับเจ้าหน้าที่รักษาความปลอดภัย (รปภ.) เท่านั้น</p>
      </div>

      <!-- 2. ส่วนเนื้อหาสำหรับ รปภ. -->
      <template v-else>
        <!-- Header Banner -->
        <div class="tw-bg-sky-100 tw-border-l-8 tw-border-l-sky-600 tw-p-4 sm:tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-6 md:tw-mb-8">
          <h1 class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-gray-800">ตรวจสอบสิทธิ์จอดรถ</h1>
          <p class="tw-text-xs sm:tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">Smart QR Parking — Security Check</p>
        </div>

        <!-- ผลการตรวจสอบ (แสดงแทนฟอร์มเมื่อสแกนแล้ว) -->
        <div v-if="result" class="tw-max-w-xl tw-mx-auto tw-my-4 sm:tw-my-8">
          <ScanResultCard :ok="result.ok" :reason="result.reason" @rescan="rescan" />
        </div>

        <!-- ตัวเลือกการตรวจสอบ (สแกน QR Code + ค้นหาเบอร์โทร) -->
        <div v-else class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 sm:tw-gap-6 tw-max-w-5xl tw-mx-auto">
          
          <!-- ===== กล่องที่ 1: สแกน QR Code ===== -->
          <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200/80 tw-p-5 sm:tw-p-8 tw-flex tw-flex-col tw-items-center tw-justify-between tw-text-center">
            <div class="tw-flex tw-flex-col tw-items-center">
              <div class="tw-w-16 sm:tw-w-20 tw-h-16 sm:tw-h-20 tw-bg-sky-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mb-3 sm:tw-mb-4">
                <span class="tw-text-3xl sm:tw-text-4xl">📷</span>
              </div>
              <h2 class="tw-text-lg sm:tw-text-xl tw-font-bold tw-text-gray-800">สแกน QR Code</h2>
              <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mt-1.5 tw-mb-6 tw-max-w-sm">
                ให้ผู้ป่วยแสดง QR Code จากหน้าข้อมูลนัดหมาย แล้วเปิดกล้องเพื่อสแกนตรวจสอบสิทธิ์
              </p>
            </div>

            <button
              @click="openScanner"
              :disabled="checking"
              type="button"
              class="tw-w-full tw-bg-sky-600 hover:tw-bg-sky-700 disabled:tw-bg-gray-300 tw-text-white tw-text-base sm:tw-text-lg tw-font-bold tw-py-3.5 sm:tw-py-4 tw-px-6 tw-rounded-xl tw-shadow-md hover:tw-shadow-lg tw-transition-all tw-flex tw-items-center tw-justify-center tw-gap-2.5"
            >
              <span class="tw-text-xl sm:tw-text-2xl">📷</span>
              <span>เปิดกล้องสแกน QR</span>
            </button>
          </div>

          <!-- ===== กล่องที่ 2: ค้นหาด้วยเบอร์โทรศัพท์ ===== -->
          <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200/80 tw-p-5 sm:tw-p-8 tw-flex tw-flex-col tw-items-center tw-justify-between tw-text-center">
            <div class="tw-flex tw-flex-col tw-items-center tw-w-full">
              <div class="tw-w-16 sm:tw-w-20 tw-h-16 sm:tw-h-20 tw-bg-emerald-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mb-3 sm:tw-mb-4">
                <span class="tw-text-3xl sm:tw-text-4xl">📞</span>
              </div>
              <h2 class="tw-text-lg sm:tw-text-xl tw-font-bold tw-text-gray-800">ค้นหาด้วยเบอร์โทรศัพท์</h2>
              <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mt-1.5 tw-mb-6 tw-max-w-sm">
                กรณีผู้ป่วยไม่มียานพาหนะ หรือไม่สะดวกเปิด QR Code สามารถใช้เบอร์โทรแทนได้
              </p>
            </div>

            <form class="tw-w-full tw-space-y-3" @submit.prevent="searchPhone">
              <div class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2 sm:tw-gap-3">
                <input
                  v-model="phone"
                  type="tel"
                  inputmode="numeric"
                  maxlength="10"
                  placeholder="เบอร์โทรศัพท์ 10 หลัก"
                  class="tw-flex-1 tw-px-4 tw-py-3 sm:tw-py-3.5 tw-rounded-xl tw-border tw-border-slate-300 tw-text-sm sm:tw-text-base focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400 tw-bg-white"
                />
                <button
                  type="submit"
                  :disabled="checking"
                  class="tw-w-full sm:tw-w-auto tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-300 tw-text-white tw-text-sm sm:tw-text-base tw-font-bold tw-py-3 sm:tw-py-3.5 tw-px-6 sm:tw-px-8 tw-rounded-xl tw-shadow-md hover:tw-shadow-lg tw-transition-all tw-whitespace-nowrap"
                >
                  {{ checking ? 'กำลังตรวจ...' : 'ค้นหา' }}
                </button>
              </div>

              <p v-if="phoneError" class="tw-text-xs sm:tw-text-sm tw-text-red-500 tw-text-left">
                กรุณากรอกเบอร์โทรศัพท์ก่อนค้นหา
              </p>
            </form>
          </div>

        </div>

        <!-- แถบแจ้งเตือน Error จาก Server -->
        <p v-if="errorMsg" class="tw-text-center tw-text-xs sm:tw-text-sm tw-text-red-600 tw-mt-6 tw-bg-red-50 tw-max-w-md tw-mx-auto tw-p-2.5 tw-rounded-lg tw-border tw-border-red-200">
          ⚠️ {{ errorMsg }}
        </p>
      </template>

    </main>

    <!-- ===== Modal กล้องสแกน QR Code ===== -->
    <QrScanner :open="scannerOpen" @decoded="onDecoded" @cancel="scannerOpen = false" />
  </div>
</template>

<script setup>
// ============================================================
// Role guard — Security_guard only
// ============================================================

const { role } = useSession()

const isGuard = computed(() => role.value === 'Security_guard')

watch(role, (r) => {
  if (r && r !== 'Security_guard') {
    navigateTo(r === 'Admin' ? '/admin/staff' : '/appointments')
  }
}, { immediate: true })

// ============================================================
// State
// ============================================================

const scannerOpen = ref(false)
const checking = ref(false)
const phone = ref('')
const phoneError = ref(false)
const result = ref(null)
const errorMsg = ref('')
const lastMethod = ref(null)

// ============================================================
// Actions
// ============================================================

const openScanner = () => {
  if (scannerOpen.value) return
  errorMsg.value = ''
  scannerOpen.value = true
}

const onDecoded = (value) => {
  scannerOpen.value = false
  lastMethod.value = 'qr'
  verifyBody('qr', value)
}

const searchPhone = () => {
  if (checking.value) return
  phoneError.value = false
  if (!phone.value.trim()) {
    phoneError.value = true
    return
  }
  lastMethod.value = 'phone'
  verifyBody('phone', phone.value)
  phone.value = ''
}

const rescan = () => {
  result.value = null
  errorMsg.value = ''
  if (lastMethod.value === 'qr') {
    openScanner()
  }
}

const verifyBody = async (method, value) => {
  if (checking.value) return
  checking.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch('/api/scan/verify', {
      method: 'POST',
      body: { method, value },
    })
    result.value = { ok: !!res.ok, reason: res.reason ?? null }
  } catch (err) {
    errorMsg.value = err?.data?.statusMessage || err?.message || 'ไม่สามารถตรวจสอบสิทธิ์ได้'
  } finally {
    checking.value = false
  }
}
</script>