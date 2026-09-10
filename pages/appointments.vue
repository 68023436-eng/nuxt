<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="tw-flex-1 tw-min-w-0 tw-p-4 md:tw-p-8">
      <!-- Header Banner พร้อมปุ่มรีเฟรช -->
      <div class="tw-flex tw-flex-col md:tw-flex-row tw-gap-4 md:tw-items-center md:tw-justify-between tw-bg-amber-100 tw-border-l-8 tw-border-l-amber-500 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
        <div>
          <h1 class="tw-text-2xl tw-font-bold tw-text-black">รายการนัดหมาย</h1>
          <p class="tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">Hospital Appointments &amp; Parking Management</p>
        </div>

        <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
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
      <div v-else-if="activeAppointments.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
        <p class="tw-text-gray-400 tw-text-lg">ยังไม่มีรายการนัดหมายที่เปิดใช้งานอยู่</p>
        <p class="tw-text-gray-300 tw-text-sm tw-mt-1">กรุณาไปหน้า "กรอกข้อมูล" เพื่อเพิ่มใบนัดใหม่ หรือตรวจสอบรายการที่ย้ายไปที่หน้า "ประวัติ"</p>
      </div>

      <!-- Data Table -->
      <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
        <div class="tw-overflow-x-auto">
        <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[920px]">
          <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
            <tr>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-12">ลำดับ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[200px]">ชื่อผู้ป่วย / เบอร์โทร</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[140px]">ทะเบียนรถ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[200px]">แผนกตรวจ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[190px]">วันนัดหมาย / เวลา</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[110px]">สถานะ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[150px] tw-text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(item, index) in activeAppointments" 
              :key="item.appointment_id"
              class="tw-border-b tw-border-slate-100 hover:tw-bg-slate-50 tw-transition-colors"
            >
              <!-- ลำดับ -->
              <td class="tw-px-5 tw-py-4 tw-text-gray-500 tw-whitespace-nowrap">{{ index + 1 }}</td>
              
              <!-- ชื่อและเบอร์โทรศัพท์ -->
              <td class="tw-px-5 tw-py-4">
                <div class="tw-font-medium tw-text-gray-800 tw-truncate tw-max-w-[190px]" :title="item.patient_name">{{ item.patient_name }}</div>
                <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5 tw-whitespace-nowrap">{{ item.phone_number || '-' }}</div>
              </td>

              <!-- ทะเบียนรถยนต์ -->
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                  {{ item.license_plate }}
                </span>
              </td>

              <!-- แผนกตรวจ -->
              <td class="tw-px-5 tw-py-4 tw-text-gray-700">
                <span class="tw-line-clamp-2">{{ item.department_name || item.dept_id || '-' }}</span>
              </td>

              <!-- วันและเวลา -->
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                <div class="tw-text-xs tw-text-amber-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
              </td>

              <!-- สถานะ -->
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <span :class="statusClass(item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                  {{ statusLabel(item.status) }}
                </span>
              </td>

              <!-- ปุ่มจัดการ -->
              <td class="tw-px-5 tw-py-4 tw-text-center tw-whitespace-nowrap">
                <div class="tw-flex tw-justify-center tw-gap-2">
                  <button 
                    @click="openDetail(item)"
                    class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                  >
                    ดูเพิ่มเติม
                  </button>
                  <button 
                    v-if="canCancel"
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
        </div>

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
          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-max-h-[90vh] tw-flex tw-flex-col tw-overflow-hidden tw-transform tw-transition-all">
            
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

            <!-- Modal Body (scroll เฉพาะส่วนนี้ หากเนื้อหายาวเกินจอ) -->
            <div v-if="selectedAppointment" class="tw-px-6 tw-py-5 tw-space-y-4 tw-min-h-0 tw-flex-1 tw-overflow-y-auto">

              <!-- ======= QR Code Section (เด่นสุด สำหรับนำไปสแกนกับ รปภ.) ======= -->
              <div class="tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-p-5 tw-flex tw-flex-col tw-items-center tw-gap-3">
                <div class="tw-text-center">
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">QR CODE สำหรับเข้านัดหมาย</p>
                  <p class="tw-text-xs tw-text-gray-500 tw-mt-0.5">นำไปแสดงให้เจ้าหน้าที่ รปภ. สแกนที่จุดเข้าออก</p>
                </div>

                <QrCodeDisplay :value="selectedAppointment.qr_token" :size="200" />

                <!-- แสดง token แบบสั้น เพื่อตรวจสอบด้วยตา / copy ได้ -->
                <p class="tw-text-gray-700 tw-font-mono tw-text-sm break-all tw-text-center tw-bg-white tw-rounded-lg tw-px-3 tw-py-1 tw-border tw-border-slate-200">
                  {{ selectedAppointment.qr_token || 'ไม่มี QR Token' }}
                </p>

                <!-- ปุ่มนำทาง (Google Maps) ใกล้ๆ QR สำหรับหาจุดจอดรถ + อาคารคลินิก -->
                <div class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2 tw-w-full tw-justify-center">
                  <MapsDirectionsButton
                    :destination="parkingDestination"
                    :coord="PARKING_COORD"
                    label="นำทางไปจุดจอดรถ"
                    icon="🅿️"
                  />
                  <MapsDirectionsButton
                    :destination="clinicDestination"
                    :coord="CLINIC_COORD"
                    label="นำทางไปอาคารคลินิก"
                    icon="🏥"
                  />
                </div>
              </div>

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
                <strong class="tw-text-gray-800 tw-font-semibold">{{ itemToDelete?.patient_name }}</strong> 
                (ID: {{ itemToDelete?.appointment_id }}) ใช่หรือไม่?
              </p>
              <p class="tw-text-xs tw-text-amber-600 tw-bg-amber-50 tw-p-2.5 tw-rounded-lg tw-border tw-border-amber-200">
                รายการนี้จะถูกย้ายไปเก็บในหน้าประวัติเป็นเวลา <strong>{{ RETENTION_DAYS }} วัน</strong> 
                เมื่อครบกำหนดจะถูกลบออกจากระบบอัตโนมัติ — คุณสามารถกู้คืนได้ก่อนครบกำหนด
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
// ============================================================
// Composables
// ============================================================

import { buildParkingDestination, buildClinicDestination, PARKING_COORD, CLINIC_COORD } from '~/constants/clinic'
import { RETENTION_DAYS } from '~/constants/appointments'

const { statusClass, statusLabel, formatDate, formatDateTime } = useAppointment()

const { canCancel } = useSession()

// ============================================================
// State
// ============================================================

const appointments = ref([])
const loading = ref(false)
const errorMsg = ref('')
const deletingId = ref(null)

// ตัวกรองเฉพาะรายการที่ยังใช้งานอยู่ (active, backup)
const activeAppointments = computed(() => {
  return appointments.value.filter(item => item.status !== 'completed' && item.status !== 'cancelled')
})

// Detail Modal State
const showModal = ref(false)
const selectedAppointment = ref(null)

// ปลายทางนำทาง (Google Maps) ใช้ใน section QR Code
const parkingDestination = computed(() =>
  buildParkingDestination(selectedAppointment.value?.building_name || null),
)
const clinicDestination = computed(() => buildClinicDestination())

// Delete Confirm Modal State
const showDeleteModal = ref(false)
const itemToDelete = ref(null)

// ============================================================
// ดึงข้อมูลผ่าน Nuxt Server API
// ============================================================

const fetchAppointments = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('/api/appointments', { method: 'GET' })
    appointments.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อดึงข้อมูลได้'
    console.error('Fetch appointments error:', error)
  } finally {
    loading.value = false
  }
}

// ============================================================
// Delete Modal Actions
// ============================================================

const askDeleteAppointment = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const confirmDeleteAppointment = async () => {
  if (!itemToDelete.value) return

  const appointmentId = itemToDelete.value.appointment_id
  deletingId.value = appointmentId

  try {
    await $fetch(`/api/appointments/${appointmentId}`, { method: 'DELETE' })

    // อัปเดตสถานะในหน้าเว็บทันที (รายการจะหายจากตารางเพราะ activeAppointments กรองออก)
    const targetItem = appointments.value.find(item => item.appointment_id === appointmentId)
    if (targetItem) {
      targetItem.status = 'cancelled'
    }

    closeDeleteModal()
    alert(`ลบและย้ายข้อมูลไปหน้าประวัติเรียบร้อยแล้ว ข้อมูลจะถูกลบถาวรหลังครบ ${RETENTION_DAYS} วัน`)
  } catch (error) {
    const detail = error?.data?.statusMessage || error?.data?.message || error?.message || 'ไม่ทราบสาเหตุ'
    alert('เกิดข้อผิดพลาดในการลบ: ' + detail)
    console.error('Delete error details:', { status: error?.status, statusCode: error?.statusCode, detail, full: error })
  } finally {
    deletingId.value = null
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
  fetchAppointments()
})
</script>