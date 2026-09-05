<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="tw-flex-1 tw-p-8">
      <!-- Header Banner พร้อมปุ่มรีเฟรช -->
      <div class="tw-flex tw-justify-between tw-items-center tw-bg-amber-100 tw-border-l-8 tw-border-l-amber-500 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
        <div>
          <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">รายการนัดหมาย</h1>
          <p class="tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">Hospital Appointments & Parking Management</p>
        </div>

        <div class="tw-flex tw-items-center tw-gap-3">
          <!-- ปุ่มรีเฟรชข้อมูล -->
          <button 
            @click="fetchAppointments" 
            :disabled="loading"
            class="tw-bg-white hover:tw-bg-amber-50 disabled:tw-bg-gray-100 tw-text-amber-800 tw-border tw-border-amber-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
          >
            <span>{{ loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="tw-text-center tw-py-12">
        <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-amber-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
        <p class="tw-text-gray-500 tw-text-lg tw-mt-3">กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
        <p>เกิดข้อผิดพลาด: {{ errorMsg }}</p>
        <button @click="fetchAppointments" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800">ลองอีกครั้ง</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="activeAppointments.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-12 tw-rounded-2xl tw-text-center">
        <p class="tw-text-gray-400 tw-text-lg">ยังไม่มีรายการนัดหมายที่เปิดใช้งานอยู่</p>
        <p class="tw-text-gray-300 tw-text-sm tw-mt-1">กรุณาไปหน้า "กรอกข้อมูล" เพื่อเพิ่มใบนัดใหม่ หรือตรวจสอบรายการที่ย้ายไปที่หน้า "ประวัติ"</p>
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
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">วันนัดหมาย / เวลา</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">สถานะ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(item, index) in activeAppointments" 
              :key="item.appointment_id"
              class="tw-border-b tw-border-slate-100 hover:tw-bg-slate-50 tw-transition-colors"
            >
              <!-- ลำดับ -->
              <td class="tw-px-5 tw-py-4 tw-text-gray-500">{{ index + 1 }}</td>
              
              <!-- ชื่อและเบอร์โทรศัพท์ -->
              <td class="tw-px-5 tw-py-4">
                <div class="tw-font-medium tw-text-gray-800">{{ item.patient_name }}</div>
                <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5">{{ item.phone_number || '-' }}</div>
              </td>

              <!-- ทะเบียนรถยนต์ -->
              <td class="tw-px-5 tw-py-4">
                <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                  {{ item.license_plate }}
                </span>
              </td>

              <!-- แผนกตรวจ -->
              <td class="tw-px-5 tw-py-4 tw-text-gray-700">
                {{ item.department_name || item.dept_id || '-' }}
              </td>

              <!-- วันและเวลา -->
              <td class="tw-px-5 tw-py-4">
                <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                <div class="tw-text-xs tw-text-amber-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
              </td>

              <!-- สถานะ -->
              <td class="tw-px-5 tw-py-4">
                <span :class="statusClass(item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                  {{ statusLabel(item.status) }}
                </span>
              </td>

              <!-- ปุ่มจัดการ -->
              <td class="tw-px-5 tw-py-4 tw-text-center">
                <div class="tw-flex tw-justify-center tw-gap-2">
                  <button 
                    @click="openDetail(item)"
                    class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                  >
                    ดูเพิ่มเติม
                  </button>
                  <button 
                    @click="askDeleteAppointment(item)"
                    :disabled="deletingId === item.appointment_id"
                    class="tw-bg-red-500 hover:tw-bg-red-600 disabled:tw-bg-gray-300 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                  >
                    {{ deletingId === item.appointment_id ? 'กำลังลบ...' : 'ลบ' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Summary -->
        <div class="tw-px-6 tw-py-3 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-sm tw-text-gray-500">
          ทั้งหมด {{ activeAppointments.length }} รายการ
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
          <!-- Backdrop -->
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeModal"></div>

          <!-- Modal Content -->
          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-overflow-hidden tw-transform tw-transition-all">
            
            <!-- Modal Header -->
            <div class="tw-bg-gradient-to-r tw-from-amber-400 tw-to-amber-500 tw-px-6 tw-py-4">
              <div class="tw-flex tw-items-center tw-justify-between">
                <h2 class="tw-text-lg tw-font-bold tw-text-white">รายละเอียดนัดหมาย</h2>
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
              
              <!-- รหัสนัดหมาย -->
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
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">ทะเบียนรถยนต์ที่จองสิทธิ์</p>
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
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.department_name || `รหัสแผนก: ${selectedAppointment.dept_id}` }}</p>
                </div>
              </div>

              <!-- ตึกและจุดจอด -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-violet-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-violet-500 tw-text-sm">🅿️</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">อาคารจอดรถ</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.building_name || 'อาคาร PremiumClinic' }}</p>
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
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">QR Token สำหรับสแกน</p>
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

              <!-- วันที่สร้าง -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-rose-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-rose-500 tw-text-sm">⏰</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">วันที่สร้างรายการ</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ formatDateTime(selectedAppointment.created_at) }}</p>
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

    <!-- ======= Delete Confirm Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showDeleteModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
        >
          <!-- Backdrop -->
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeDeleteModal"></div>

          <!-- Modal Content -->
          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transform tw-transition-all">
            
            <div class="tw-p-6 tw-text-center">
              <h3 class="tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-2">ยืนยันการลบรายการนัดหมาย</h3>
              <p class="tw-text-sm tw-text-gray-600 tw-mb-3">
                คุณต้องการลบรายการนัดหมายของ 
                <strong class="tw-text-gray-800 font-semibold">{{ itemToDelete?.patient_name }}</strong> 
                (ID: {{ itemToDelete?.appointment_id }}) ใช่หรือไม่?
              </p>
              <p class="tw-text-xs tw-text-amber-600 tw-bg-amber-50 tw-p-2.5 tw-rounded-lg tw-border tw-border-amber-200">
                รายการนี้จะถูกลบออกจากระบบของโรงพยาบาล
              </p>
            </div>

            <!-- Modal Footer -->
            <div class="tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end tw-gap-3">
              <button 
                @click="closeDeleteModal"
                :disabled="deletingId !== null"
                class="tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                @click="confirmDeleteAppointment"
                :disabled="deletingId !== null"
                class="tw-bg-red-600 hover:tw-bg-red-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm"
              >
                {{ deletingId !== null ? 'กำลังลบ...' : 'ยืนยันลบรายการ' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Sidebar from '~/components/sidebar.vue'

// บังคับ login ก่อนเข้าหน้านี้
definePageMeta({
  middleware: 'auth',
})

// State
const appointments = ref([])
const loading = ref(false)
const errorMsg = ref('')
const deletingId = ref(null)

// ตัวกรองเฉพาะรายการที่ยังใช้งานอยู่
const activeAppointments = computed(() => {
  return appointments.value.filter(item => item.status !== 'completed' && item.status !== 'cancelled')
})

// Detail Modal State
const showModal = ref(false)
const selectedAppointment = ref(null)

// Delete Confirm Modal State
const showDeleteModal = ref(false)
const itemToDelete = ref(null)

// ดึงข้อมูลผ่าน FastAPI Backend
const fetchAppointments = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('http://localhost:8000/api/appointments', { method: 'GET' })
    appointments.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.detail || error?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อดึงข้อมูลได้'
    console.error('Fetch appointments error:', error)
  } finally {
    loading.value = false
  }
}

// เปิด Delete Confirm Modal
const askDeleteAppointment = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

// ปิด Delete Confirm Modal
const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

// ยืนยันลบข้อมูลผ่าน FastAPI
const confirmDeleteAppointment = async () => {
  if (!itemToDelete.value) return

  const appointmentId = itemToDelete.value.appointment_id
  deletingId.value = appointmentId

  try {
    // ยิงไปที่ Backend FastAPI พอร์ต 8000
    await $fetch(`http://localhost:8000/api/appointments/${appointmentId}`, { 
      method: 'DELETE' 
    })

    // อัปเดตสถานะในหน้าเว็บทันที (รายการจะหายจากตารางเพราะ activeAppointments กรองออก)
    const targetItem = appointments.value.find(item => item.appointment_id === appointmentId)
    if (targetItem) {
      targetItem.status = 'cancelled'
    }

    closeDeleteModal()
    alert('ลบและย้ายข้อมูลไปหน้าประวัติเรียบร้อยแล้ว')
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการลบ: ' + (error?.data?.detail || error?.message || 'ไม่ทราบสาเหตุ'))
    console.error('Delete error:', error)
  } finally {
    deletingId.value = null
  }
}

// เปิด Modal ดูรายละเอียด
const openDetail = (item) => {
  selectedAppointment.value = { ...item }
  showModal.value = true
}

// ปิด Modal ดูรายละเอียด
const closeModal = () => {
  showModal.value = false
  selectedAppointment.value = null
}

// จัดการสี Badge สถานะ
const statusClass = (status) => {
  const classes = {
    active: 'tw-bg-green-100 tw-text-green-700',
    completed: 'tw-bg-blue-100 tw-text-blue-700',
    cancelled: 'tw-bg-red-100 tw-text-red-700',
    backup: 'tw-bg-purple-100 tw-text-purple-700 tw-border tw-border-purple-200',
  }
  return classes[status] || 'tw-bg-gray-100 tw-text-gray-700'
}

// แปลงคำแสดงสถานะ
const statusLabel = (status) => {
  const labels = {
    active: 'กำลังใช้งาน',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
    backup: 'ข้อมูล backup',
  }
  return labels[status] || status || '-'
}

// แปลงรูปแบบวันที่
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// แปลงรูปแบบวันที่และเวลาสร้างรายการ
const formatDateTime = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-'
  // หากสตริงถูกฟอร์แมตมาจาก backend แล้วให้แสดงตรงๆ หรือแปลงตาม Date
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchAppointments()
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