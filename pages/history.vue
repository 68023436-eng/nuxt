<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="tw-flex-1 tw-p-8">
      <!-- Header Banner พร้อมปุ่มรีเฟรช -->
      <div class="tw-flex tw-justify-between tw-items-center tw-bg-purple-100 tw-border-l-8 tw-border-l-purple-600 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
        <div>
          <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">การเก็บประวัตินัดหมาย</h1>
          <p class="tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">Appointments History</p>
        </div>

        <!-- ปุ่มรีเฟรชข้อมูล -->
        <button 
          @click="fetchHistory" 
          :disabled="loading"
          class="tw-bg-white hover:tw-bg-purple-50 disabled:tw-bg-gray-100 tw-text-purple-800 tw-border tw-border-purple-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
        >
          <span>{{ loading ? 'กำลังโหลด...' : 'รีเฟรชประวัติ' }}</span>
        </button>
      </div>

      <!-- Success Notification Toast -->
      <div v-if="toastMsg" class="tw-mb-6 tw-bg-green-50 tw-border tw-border-green-200 tw-p-4 tw-rounded-xl tw-text-green-700 tw-text-sm tw-flex tw-items-center tw-justify-between tw-shadow-sm">
        <div class="tw-flex tw-items-center tw-gap-2">
          <span class="tw-text-lg">✅</span>
          <span>{{ toastMsg }}</span>
        </div>
        <button @click="toastMsg = ''" class="tw-text-green-500 hover:tw-text-green-700 tw-font-bold">✕</button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="tw-text-center tw-py-12">
        <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-purple-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
        <p class="tw-text-gray-500 tw-text-lg tw-mt-3">กำลังโหลดประวัติ...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
        <p>เกิดข้อผิดพลาด: {{ errorMsg }}</p>
        <button @click="fetchHistory" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800">ลองอีกครั้ง</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="historyAppointments.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-12 tw-rounded-2xl tw-text-center">
        <p class="tw-text-gray-400 tw-text-lg">ยังไม่มีรายการประวัติที่ถูกลบหรือยกเลิก</p>
        <p class="tw-text-gray-400 tw-text-sm tw-mt-1">รายการนัดหมายที่ถูกลบออกจากหน้ารายการนัดหมายจะมาแสดงที่นี่</p>
      </div>

      <!-- Data Table -->
      <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
        <table class="tw-w-full tw-text-sm tw-text-left">
          <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
            <tr>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">ลำดับ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">ชื่อผู้ป่วย / เบอร์โทร</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">ทะเบียนรถ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">แผนกตรวจ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">วันและเวลานัดหมาย</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">สถานะ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(item, index) in historyAppointments" 
              :key="item.appointment_id"
              class="tw-border-b tw-border-slate-100 hover:tw-bg-slate-50 tw-transition-colors"
            >
              <td class="tw-px-5 tw-py-4 tw-text-gray-500">{{ index + 1 }}</td>
              <td class="tw-px-5 tw-py-4">
                <div class="tw-font-medium tw-text-gray-800">{{ item.patient_name }}</div>
                <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5">{{ item.phone_number || '-' }}</div>
              </td>
              <td class="tw-px-5 tw-py-4">
                <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                  {{ item.license_plate }}
                </span>
              </td>
              <td class="tw-px-5 tw-py-4 tw-text-gray-700">
                {{ item.department_name || item.dept_id || '-' }}
              </td>
              <td class="tw-px-5 tw-py-4">
                <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                <div class="tw-text-xs tw-text-purple-600 tw-font-medium">{{ item.time_slot }}</div>
              </td>
              <td class="tw-px-5 tw-py-4">
                <span :class="statusClass(item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td class="tw-px-5 tw-py-4 tw-text-center">
                <div class="tw-flex tw-justify-center tw-gap-2">
                  <!-- ปุ่มดูเพิ่มเติม -->
                  <button 
                    @click="openDetail(item)"
                    class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                  >
                    ดูเพิ่มเติม
                  </button>
                  <!-- ปุ่มกู้กลับ -->
                  <button 
                    v-if="canRestore"
                    @click="askRestoreAppointment(item)"
                    :disabled="restoringId === item.appointment_id"
                    class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-300 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors tw-shadow-sm tw-flex tw-items-center tw-gap-1"
                  >
                    <span>{{ restoringId === item.appointment_id ? 'กำลังกู้คืน...' : ' กู้กลับ' }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Summary -->
        <div class="tw-px-6 tw-py-3 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-sm tw-text-gray-500">
          ประวัติทั้งหมด {{ historyAppointments.length }} รายการ
        </div>
      </div>
    </div>

    <!-- ======= Detail Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
        >
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeModal"></div>

          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-overflow-hidden tw-transform tw-transition-all">
            <!-- Modal Header -->
            <div class="tw-bg-gradient-to-r tw-from-purple-500 tw-to-indigo-600 tw-px-6 tw-py-4">
              <div class="tw-flex tw-items-center tw-justify-between">
                <h2 class="tw-text-lg tw-font-bold tw-text-white">รายละเอียดประวัตินัดหมาย</h2>
                <button 
                  @click="closeModal"
                  class="tw-text-white/80 hover:tw-text-white tw-transition-colors tw-text-2xl tw-leading-none tw-font-light"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Modal Body -->
            <div v-if="selectedAppointment" class="tw-px-6 tw-py-5 tw-space-y-4">
              <!-- Appointment ID -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-slate-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-slate-500 tw-text-sm">#</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">รหัสนัดหมาย</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.appointment_id }}</p>
                </div>
              </div>

              <!-- ชื่อผู้ป่วย -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-blue-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-blue-500 tw-text-sm">👤</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">ชื่อผู้ป่วย</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.patient_name }}</p>
                </div>
              </div>

              <!-- เบอร์โทรศัพท์ -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-emerald-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-emerald-500 tw-text-sm">📞</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">เบอร์โทรศัพท์</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.phone_number || '-' }}</p>
                </div>
              </div>

              <!-- ทะเบียนรถยนต์ -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-cyan-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-cyan-500 tw-text-sm">🚗</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">ทะเบียนรถยนต์</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.license_plate }}</p>
                </div>
              </div>

              <!-- แผนกตรวจ -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-teal-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-teal-500 tw-text-sm">🏥</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">แผนกตรวจ</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.department_name || selectedAppointment.dept_id }}</p>
                </div>
              </div>

              <!-- วันนัดหมาย -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-green-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-green-500 tw-text-sm">📅</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">วันนัดหมาย</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ formatDate(selectedAppointment.appointment_date) }}</p>
                </div>
              </div>

              <!-- ช่วงเวลา -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-purple-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-purple-500 tw-text-sm">🕐</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">ช่วงเวลา</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.time_slot }}</p>
                </div>
              </div>

              <!-- QR Token -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-indigo-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-indigo-500 tw-text-sm">🔑</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">QR Token</p>
                  <p class="tw-text-gray-800 tw-font-mono tw-text-sm">{{ selectedAppointment.qr_token }}</p>
                </div>
              </div>

              <!-- สถานะ -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-amber-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-amber-500 tw-text-sm">📋</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">สถานะ</p>
                  <span :class="statusClass(selectedAppointment.status)" class="tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium tw-mt-0.5">
                    {{ statusLabel(selectedAppointment.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end">
              <button 
                @click="closeModal"
                class="tw-bg-slate-200 hover:tw-bg-slate-300 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ======= Restore Confirm Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showRestoreModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
        >
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeRestoreModal"></div>

          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transform tw-transition-all">
            <div class="tw-p-6 tw-text-center">
              <h3 class="tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-2">ยืนยันการกู้คืนข้อมูล</h3>
              <p class="tw-text-sm tw-text-gray-600 tw-mb-4">
                คุณต้องการกู้คืนรายการนัดหมายของ 
                <strong class="tw-text-gray-800 tw-font-semibold">{{ itemToRestore?.patient_name }}</strong> 
                (ID: {{ itemToRestore?.appointment_id }}) กลับไปยังหน้ารายการนัดหมายใช่หรือไม่?
              </p>
              <p class="tw-text-xs tw-text-purple-700 tw-bg-purple-50 tw-p-3 tw-rounded-xl tw-border tw-border-purple-200">
                เมื่อกู้คืนแล้ว สถานะรายการจะถูกเปลี่ยนเป็น <strong>"ข้อมูล backup"</strong> และนำกลับไปแสดงในหน้ารายการนัดหมายทันที
              </p>
            </div>

            <!-- Modal Footer -->
            <div class="tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end tw-gap-3">
              <button 
                @click="closeRestoreModal"
                :disabled="restoringId !== null"
                class="tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                @click="confirmRestoreAppointment"
                :disabled="restoringId !== null"
                class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm"
              >
                {{ restoringId !== null ? 'กำลังกู้คืน...' : 'ยืนยันกู้คืนข้อมูล' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
// ============================================================
// Composables
// ============================================================

const { statusClass, statusLabel, formatDate } = useAppointment()

const { canRestore } = useSession()

// ============================================================
// State
// ============================================================

const appointments = ref([])
const loading = ref(false)
const errorMsg = ref('')
const restoringId = ref(null)
const toastMsg = ref('')

// กรองเอาเฉพาะรายการที่ถูกยกเลิก (cancelled) หรือเสร็จสิ้น (completed)
const historyAppointments = computed(() => {
  return appointments.value.filter(item => item.status === 'cancelled' || item.status === 'completed')
})

// Detail Modal State
const showModal = ref(false)
const selectedAppointment = ref(null)

// Restore Confirm Modal State
const showRestoreModal = ref(false)
const itemToRestore = ref(null)

// ============================================================
// ดึงประวัติจาก Nuxt Server API
// ============================================================

const fetchHistory = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('/api/appointments', { method: 'GET' })
    appointments.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'ไม่สามารถดึงข้อมูลประวัติได้'
  } finally {
    loading.value = false
  }
}

// ============================================================
// Restore Modal Actions
// ============================================================

const askRestoreAppointment = (item) => {
  itemToRestore.value = item
  showRestoreModal.value = true
}

const closeRestoreModal = () => {
  showRestoreModal.value = false
  itemToRestore.value = null
}

const confirmRestoreAppointment = async () => {
  if (!itemToRestore.value) return

  const appointmentId = itemToRestore.value.appointment_id
  const patientName = itemToRestore.value.patient_name
  restoringId.value = appointmentId

  try {
    await $fetch(`/api/appointments/${appointmentId}/restore`, { method: 'POST' })

    // อัปเดตในตารางฝั่งหน้าเว็บให้เป็น 'backup' ทันที (จะหลุดออกจากตัวกรอง historyAppointments อัตโนมัติ)
    const item = appointments.value.find(i => i.appointment_id === appointmentId)
    if (item) {
      item.status = 'backup'
    } else {
      appointments.value = appointments.value.filter(i => i.appointment_id !== appointmentId)
    }

    toastMsg.value = `กู้คืนข้อมูลของ "${patientName}" สำเร็จ! สถานะเปลี่ยนเป็น "ข้อมูล backup"`
    closeRestoreModal()

    setTimeout(() => {
      toastMsg.value = ''
    }, 4000)
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการกู้คืน: ' + (error?.data?.statusMessage || error?.message || 'ไม่ทราบสาเหตุ'))
    console.error('Restore error:', error)
  } finally {
    restoringId.value = null
  }
}

// ============================================================
// Detail Modal Actions
// ============================================================

const openDetail = (item) => {
  selectedAppointment.value = { ...item }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedAppointment.value = null
}

// ============================================================
// Lifecycle
// ============================================================

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .tw-relative,
.modal-leave-active .tw-relative {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .tw-relative {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.modal-leave-to .tw-relative {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>