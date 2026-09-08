<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-100">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="tw-flex-1 tw-p-4 sm:tw-p-8">
      <!-- Header Banner -->
      <div class="tw-bg-gradient-to-r tw-from-sky-500 tw-to-blue-600 tw-p-5 sm:tw-p-6 tw-rounded-xl tw-shadow-sm tw-mb-6">
        <h1 class="tw-text-2xl sm:tw-text-3xl tw-font-bold tw-text-white">ตรวจสอบสิทธิ์จอดรถ</h1>
        <p class="tw-text-sm tw-text-sky-100 tw-mt-1 tw-font-mono">Smart QR Parking — Security Check</p>
      </div>

      <!-- ผลการตรวจสอบ (แสดงผลลัพธ์แทนฟอร์มเมื่อมีผล) -->
      <div v-if="result" class="tw-max-w-2xl tw-mx-auto">
        <ScanResultCard :ok="result.ok" @rescan="rescan" />
      </div>

      <!-- ชุดตรวจสอบ (สแกน QR + ค้นหาเบอร์) -->
      <div v-else class="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-5 tw-max-w-5xl tw-mx-auto">
        <!-- ===== สแกน QR Code ===== -->
        <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-p-6 sm:tw-p-8 tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center">
          <div class="tw-w-20 tw-h-20 tw-bg-sky-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mb-4">
            <span class="tw-text-4xl">📷</span>
          </div>
          <h2 class="tw-text-xl tw-font-bold tw-text-gray-800">สแกน QR Code</h2>
          <p class="tw-text-sm tw-text-slate-500 tw-mt-1 tw-mb-6">
            ให้ผู้ป่วยแสดง QR Code จากหน้าข้อมูลนัดหมาย แล้วสแกนเพื่อตรวจสอบสิทธิ์
          </p>

          <button
            @click="openScanner"
            :disabled="checking"
            class="tw-w-full sm:tw-w-auto tw-bg-sky-600 hover:tw-bg-sky-700 disabled:tw-bg-gray-300 tw-text-white tw-text-lg tw-font-bold tw-py-4 tw-px-10 tw-rounded-xl tw-shadow-md tw-transition-colors tw-flex tw-items-center tw-justify-center tw-gap-3"
          >
            <span class="tw-text-2xl">📷</span>
            สแกน QR Code
          </button>
        </div>

        <!-- ===== ค้นหาด้วยเบอร์โทรศัพท์ ===== -->
        <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-p-6 sm:tw-p-8 tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center">
          <div class="tw-w-20 tw-h-20 tw-bg-emerald-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mb-4">
            <span class="tw-text-4xl">📞</span>
          </div>
          <h2 class="tw-text-xl tw-font-bold tw-text-gray-800">ค้นหาด้วยเบอร์โทรศัพท์</h2>
          <p class="tw-text-sm tw-text-slate-500 tw-mt-1 tw-mb-6">
            กรอกเบอร์โทรศัพท์ของผู้ป่วยเพื่อตรวจสอบสิทธิ์จอดรถ
          </p>

          <form class="tw-w-full tw-flex tw-flex-col sm:tw-flex-row tw-gap-3" @submit.prevent="searchPhone">
            <input
              v-model="phone"
              type="tel"
              inputmode="numeric"
              placeholder="เบอร์โทรศัพท์ 09xxxxxxxx"
              class="tw-flex-1 tw-px-4 tw-py-4 tw-rounded-xl tw-border tw-border-slate-300 tw-text-base focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400"
            />
            <button
              type="submit"
              :disabled="checking"
              class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-300 tw-text-white tw-text-base tw-font-bold tw-py-4 tw-px-8 tw-rounded-xl tw-shadow-md tw-transition-colors"
            >
              {{ checking ? 'กำลังตรวจสอบ...' : 'ค้นหา' }}
            </button>
          </form>

          <p v-if="phoneError" class="tw-text-sm tw-text-red-500 tw-mt-2">กรุณากรอกเบอร์โทรศัพท์ก่อนค้นหา</p>
        </div>
      </div>

      <!-- แถบ error จาก server -->
      <p v-if="errorMsg" class="tw-text-center tw-text-sm tw-text-red-600 tw-mt-4">
        ⚠️ {{ errorMsg }}
      </p>
    </div>

    <!-- ===== กล้องสแกน QR ===== -->
    <QrScanner :open="scannerOpen" @decoded="onDecoded" @cancel="scannerOpen = false" />
  </div>
</template>

<script setup>
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
  // กลับไปสแกนทันทีถ้าเพิ่งตรวจด้วย QR
  if (lastMethod.value === 'qr') {
    openScanner()
  }
}

const verifyBody = async (method, value) => {
  if (checking.value) return // ป้องกัน request ซ้ำจาก click/Enter ซ้ำ (บันทึกประวัติซ้ำ)
  checking.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch('/api/scan/verify', {
      method: 'POST',
      body: { method, value },
    })
    result.value = { ok: !!res.ok }
  } catch (err) {
    errorMsg.value = err?.data?.statusMessage || err?.message || 'ไม่สามารถตรวจสอบสิทธิ์ได้'
  } finally {
    checking.value = false
  }
}
</script>