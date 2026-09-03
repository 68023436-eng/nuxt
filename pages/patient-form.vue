<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="tw-flex-1 tw-p-8">
      <!-- Header Banner -->
      <div class="tw-bg-green-100 tw-border-l-8 tw-border-l-green-500 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
        <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">กรอกข้อมูลใบนัด</h1>
        <p class="tw-text-sm tw-text-slate-500 tw-font-mono tw-mt-1">Patient Appointment Form</p>
      </div>

      <!-- Form Container -->
      <div class="tw-bg-white tw-p-6 tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-max-w-4xl">
        <form @submit.prevent="handleSubmit" class="tw-space-y-6">
          <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
            
            <!-- 1. ชื่อคนไข้ -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                ชื่อผู้ป่วย <span class="tw-text-red-500">*</span>
              </label>
              <input 
                v-model="form.patient_name" 
                type="text" 
                required
                maxlength="100"
                placeholder="เช่น สมชาย ใจดี" 
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400 focus:tw-border-transparent transition"
              />
              <p v-if="validationErrors.patient_name" class="tw-text-red-500 tw-text-xs tw-mt-1">{{ validationErrors.patient_name }}</p>
            </div>

            <!-- 2. วันนัดหมาย -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                วันนัดหมาย <span class="tw-text-red-500">*</span>
              </label>
              <input 
                v-model="form.appointment_date" 
                type="date" 
                required
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400 focus:tw-border-transparent transition"
              />
              <p v-if="validationErrors.appointment_date" class="tw-text-red-500 tw-text-xs tw-mt-1">{{ validationErrors.appointment_date }}</p>
            </div>

            <!-- 3. ช่วงเวลา -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                ช่วงเวลา <span class="tw-text-red-500">*</span>
              </label>
              <select 
                v-model="form.time_slot" 
                required
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-bg-white tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400 focus:tw-border-transparent transition"
              >
                <option value="" disabled>-- เลือกช่วงเวลา --</option>
                <option v-for="slot in timeSlots" :key="slot" :value="slot">
                  {{ slot }}
                </option>
              </select>
              <p v-if="validationErrors.time_slot" class="tw-text-red-500 tw-text-xs tw-mt-1">{{ validationErrors.time_slot }}</p>
            </div>

            <!-- 4. เลือกแผนกการรักษา -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                แผนกที่นัดหมาย <span class="tw-text-red-500">*</span>
              </label>
              <select 
                v-model.number="form.dept_id" 
                required
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-bg-white tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400 focus:tw-border-transparent transition"
              >
                <option v-for="dept in departmentList" :key="dept.id" :value="dept.id">
                  {{ dept.name }} (ID: {{ dept.id }})
                </option>
              </select>
            </div>

            <!-- 5. เจ้าหน้าที่ผู้ลงบันทึก -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                เจ้าหน้าที่ผู้ลงบันทึก
              </label>
              <select 
                v-model.number="form.user_id" 
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-bg-white tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400 focus:tw-border-transparent transition"
              >
                <option v-for="user in staffList" :key="user.id" :value="user.id">
                  {{ user.name }} ({{ user.role }})
                </option>
              </select>
            </div>

            <!-- 6. สถานที่ -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                รหัสสถานที่ (Location)
              </label>
              <select 
                v-model.number="form.location_id" 
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-bg-white tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400 focus:tw-border-transparent transition"
              >
                <option :value="1">อาคารผู้ป่วยนอก (Location ID: 1)</option>
              </select>
            </div>

          </div>

          <!-- Success Message -->
          <div v-if="successMsg" class="tw-bg-green-50 tw-border tw-border-green-200 tw-p-4 tw-rounded-xl tw-text-green-700 tw-text-sm tw-flex tw-items-center tw-gap-2">
            <span>✅</span>
            <span>{{ successMsg }}</span>
          </div>

          <!-- Error Message -->
          <div v-if="serverError" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600 tw-text-sm tw-flex tw-items-center tw-gap-2">
            <span>❌</span>
            <span>{{ serverError }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="tw-flex tw-justify-end tw-pt-4 tw-border-t tw-border-slate-100">
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="tw-bg-green-600 hover:tw-bg-green-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2.5 tw-px-6 tw-rounded-lg tw-shadow-sm transition"
            >
              {{ isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลใบนัด' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Sidebar from '~/components/sidebar.vue'

// ช่วงเวลานัดหมาย
const timeSlots = [
  '09:00 - 12:00',
  '13:00 - 16:00',
  '16:00 - 19:00',
]

// รายการแผนก (mapping กับ dept_id ในระบบ)
const departmentList = [
  { id: 91, name: 'แผนกอายุรกรรม' },
  { id: 92, name: 'แผนกศัลยกรรม' },
  { id: 93, name: 'แผนกสูติ-นรีเวชกรรม' },
  { id: 94, name: 'แผนกกระดูกและข้อ (ออร์โธปิดิกส์)' },
]

// รายการเจ้าหน้าที่ (mapping กับ user_id ในระบบ hospital_user)
const staffList = [
  { id: 9601, name: 'Chompoo (Supapron)', role: 'Clinic Staff' },
  { id: 9602, name: 'Nisa (Nisarat)', role: 'Clinic Staff' },
  { id: 9045, name: 'Ball (BallKhonlhor)', role: 'Security Guard' },
  { id: 42, name: 'Deaw (DeawKhonlhor)', role: 'Admin' },
]

// วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
const today = new Date().toISOString().split('T')[0]

// State ผูกกับฟอร์ม
const form = ref({
  patient_name: '',
  appointment_date: today,
  time_slot: '09:00 - 12:00',
  dept_id: 91,
  user_id: 9601,
  location_id: 1,
})

// Submit state
const isSubmitting = ref(false)
const successMsg = ref('')
const serverError = ref('')

// Validation errors
const validationErrors = reactive({
  patient_name: '',
  appointment_date: '',
  time_slot: '',
})

// Client-side validation
const validateForm = () => {
  let isValid = true

  validationErrors.patient_name = ''
  validationErrors.appointment_date = ''
  validationErrors.time_slot = ''

  // ตรวจสอบชื่อ
  const name = form.value.patient_name.trim()
  if (!name) {
    validationErrors.patient_name = 'กรุณากรอกชื่อผู้ป่วย'
    isValid = false
  } else if (name.length > 100) {
    validationErrors.patient_name = 'ชื่อต้องไม่เกิน 100 ตัวอักษร'
    isValid = false
  }

  // ตรวจสอบวันนัดหมาย
  if (!form.value.appointment_date) {
    validationErrors.appointment_date = 'กรุณาเลือกวันนัดหมาย'
    isValid = false
  }

  // ตรวจสอบช่วงเวลา
  if (!form.value.time_slot) {
    validationErrors.time_slot = 'กรุณาเลือกช่วงเวลา'
    isValid = false
  }

  return isValid
}

// ฟังก์ชันบันทึกข้อมูลผ่าน Server API
const handleSubmit = async () => {
  successMsg.value = ''
  serverError.value = ''

  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const body = {
      patient_name: form.value.patient_name.trim(),
      appointment_date: form.value.appointment_date,
      time_slot: form.value.time_slot,
      dept_id: form.value.dept_id,
      user_id: form.value.user_id,
      location_id: form.value.location_id,
    }

    await $fetch('/api/appointments', {
      method: 'POST',
      body
    })

    successMsg.value = 'บันทึกข้อมูลใบนัดสำเร็จเรียบร้อย!'

    // ล้างเฉพาะชื่อผู้ป่วย แต่คงค่า default อื่นๆ ไว้เพื่อความสะดวก
    form.value.patient_name = ''

    // ซ่อน success message หลัง 4 วินาที
    setTimeout(() => { successMsg.value = '' }, 4000)

  } catch (error) {
    serverError.value = error?.data?.statusMessage || error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    console.error('Insert error:', error?.data?.statusMessage || error?.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>