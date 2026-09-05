<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <Sidebar />

    <div class="tw-flex-1 tw-p-8">
      <!-- Header -->
      <div class="tw-bg-green-100 tw-border-l-8 tw-border-l-green-500 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
        <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">กรอกข้อมูลใบนัดหมาย</h1>
        <p class="tw-text-sm tw-text-slate-500 tw-font-mono tw-mt-1">Hospital Appointment &amp; Parking Registration</p>
      </div>

      <!-- Form Container -->
      <div class="tw-bg-white tw-p-6 tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-max-w-4xl">
        <form @submit.prevent="handleSubmit" class="tw-space-y-6">
          <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
            
            <!-- ชื่อคนไข้ -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                ชื่อ-นามสกุล คนไข้ <span class="tw-text-red-500">*</span>
              </label>
              <input 
                v-model="form.patient_name" 
                type="text" 
                required 
                placeholder="เช่น สมชาย ใจดี" 
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
              />
            </div>

            <!-- เบอร์โทรศัพท์ -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                เบอร์โทรศัพท์ติดต่อ <span class="tw-text-red-500">*</span>
              </label>
              <input 
                v-model="form.phone_number" 
                type="tel" 
                required 
                maxlength="10"
                pattern="[0-9]{9,10}"
                placeholder="เช่น 0812345678" 
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
              />
            </div>

            <!-- ทะเบียนรถ -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                ทะเบียนรถยนต์ <span class="tw-text-red-500">*</span>
              </label>
              <input 
                v-model="form.license_plate" 
                type="text" 
                required 
                placeholder="เช่น 1กข 1234 กทม" 
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
              />
            </div>

            <!-- แผนก (ดึงข้อมูลจาก Database) -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                แผนกที่นัดหมาย <span class="tw-text-red-500">*</span>
              </label>
              <select 
                v-model="form.dept_id" 
                required
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-bg-white tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
              >
                <option :value="null" disabled>-- เลือกแผนกการรักษา --</option>
                <option v-for="hospital_dept in departmentList" :key="hospital_dept.dept_id" :value="hospital_dept.dept_id">
                  {{ hospital_dept.dept_name_th }} ({{ hospital_dept.dept_name_en }})
                </option>
              </select>
            </div>

            <!-- วันที่นัดหมาย -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                วันที่นัดหมาย <span class="tw-text-red-500">*</span>
              </label>
              <input 
                v-model="form.appointment_date" 
                type="date" 
                required 
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
              />
            </div>

            <!-- ช่วงเวลานัดหมาย -->
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                ช่วงเวลาเข้าตรวจ <span class="tw-text-red-500">*</span>
              </label>
              <select 
                v-model="form.time_slot" 
                required
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-bg-white tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
              >
                <option value="" disabled>-- เลือกช่วงเวลา --</option>
                <option value="09:00 - 12:00">ช่วงเช้า (09:00 - 12:00)</option>
                <option value="13:00 - 16:00">ช่วงบ่าย (13:00 - 16:00)</option>
              </select>
            </div>

          </div>

          <!-- Submit Button -->
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
// ============================================================
// State
// ============================================================

const form = ref({
  patient_name: '',
  phone_number: '',
  license_plate: '',
  dept_id: null,
  appointment_date: '',
  time_slot: '',
})

const departmentList = ref([])
const isSubmitting = ref(false)

// ============================================================
// ดึงข้อมูลแผนกจาก FastAPI Backend
// ============================================================

const fetchDepartments = async () => {
  try {
    const data = await $fetch('http://localhost:8000/api/departments')
    departmentList.value = data
  } catch (error) {
    console.error('โหลดข้อมูลแผนกไม่สำเร็จ:', error)
  }
}

// ============================================================
// บันทึกข้อมูลผ่าน Nuxt Server API
// ============================================================

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload = { ...form.value }

    const res = await $fetch('/api/appointments', {
      method: 'POST',
      body: payload,
    })

    alert(`สร้างใบนัดสำเร็จ! รหัส QR: ${res.data?.qr_token || '-'}`)

    // รีเซ็ตฟอร์ม
    form.value = {
      patient_name: '',
      phone_number: '',
      license_plate: '',
      dept_id: '',
      appointment_date: '',
      time_slot: '',
    }
  } catch (error) {
    const message = error?.data?.statusMessage || error?.message || 'ไม่ทราบสาเหตุ'
    alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${message}`)
    console.error('Submit error:', error)
  } finally {
    isSubmitting.value = false
  }
}

// ============================================================
// Lifecycle
// ============================================================

onMounted(() => {
  fetchDepartments()
})
</script>