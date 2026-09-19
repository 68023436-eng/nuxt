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
      <div class="tw-space-y-6 tw-max-w-4xl">

        <!-- ======= สร้างบัญชีผู้ป่วยใหม่ (แสดงตรงบนหน้าเสมอ — ไม่ซ่อนใน accordion) ======= -->
        <div class="tw-bg-white tw-p-6 tw-rounded-2xl tw-shadow-sm tw-border tw-border-green-200">
          <h2 class="tw-text-lg tw-font-bold tw-text-gray-800">สร้างบัญชีผู้ป่วยใหม่</h2>
          <p class="tw-text-xs tw-text-slate-400 tw-mt-1 mb-4">
            สร้างบัญชีให้ผู้ป่วยใช้ Login (ชื่อ + นามสกุล + เบอร์โทรศัพท์) — Clinic Staff สร้างให้เท่านั้น ผู้ป่วยสมัครเองไม่ได้
          </p>

          <div v-if="createError" class="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-600 tw-text-sm tw-p-3 tw-rounded-lg tw-mb-4">
            {{ createError }}
          </div>

          <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">ชื่อ <span class="tw-text-red-500">*</span></label>
              <input
                v-model="createForm.first_name"
                type="text"
                maxlength="50"
                placeholder="เช่น สมชาย"
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
                @input="createForm.first_name = collapseSpaces(createForm.first_name)"
              />
            </div>
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">นามสกุล <span class="tw-text-red-500">*</span></label>
              <input
                v-model="createForm.last_name"
                type="text"
                maxlength="50"
                placeholder="เช่น ใจดี"
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
                @input="createForm.last_name = collapseSpaces(createForm.last_name)"
              />
            </div>
            <div>
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">เบอร์โทรศัพท์ <span class="tw-text-red-500">*</span></label>
              <input
                v-model="createForm.phone_number"
                type="tel"
                maxlength="10"
                inputmode="numeric"
                placeholder="เช่น 0812345678"
                class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-rounded-lg tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
              />
            </div>
          </div>

          <div class="tw-flex tw-justify-end tw-mt-4">
            <button
              type="button"
              :disabled="isCreating"
              @click="handleCreateAccount"
              class="tw-bg-green-600 hover:tw-bg-green-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-shadow-sm tw-text-sm tw-transition-colors"
            >
              {{ isCreating ? 'กำลังสร้าง...' : 'สร้างบัญชีผู้ป่วย' }}
            </button>
          </div>
        </div>

        <!-- ======= กรอกข้อมูลใบนัดหมาย ======= -->
        <div class="tw-bg-white tw-p-6 tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100">
          <form @submit.prevent="handleSubmit" class="tw-space-y-6">
          <div class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">

            <!-- เลือกผู้ป่วย (ต้องมีบัญชี) — searchable select / autocomplete -->
            <div class="md:tw-col-span-2">
              <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                ผู้ป่วย (ต้องมีบัญชีแล้ว) <span class="tw-text-red-500">*</span>
              </label>
              <div class="tw-relative">
                <input
                  v-model="patientSearch"
                  type="text"
                  autocomplete="off"
                  placeholder="-- เลือกผู้ป่วย --"
                  class="tw-w-full tw-border tw-border-gray-300 tw-p-2.5 tw-pr-10 tw-rounded-lg tw-bg-white tw-outline-none focus:tw-ring-2 focus:tw-ring-green-400"
                  @focus="patientSearchOpen = true"
                  @input="patientSearchOpen = true"
                  @blur="patientSearchOpen = false"
                  @keydown.down.prevent="moveHighlight(1)"
                  @keydown.up.prevent="moveHighlight(-1)"
                  @keydown.enter.prevent="handlePatientEnter"
                  @keydown.escape="patientSearchOpen = false"
                />
                <button
                  v-if="patientSearch !== '' || form.patient_user_id"
                  type="button"
                  aria-label="ล้างผู้ป่วยที่เลือก"
                  title="ล้างผู้ป่วยที่เลือก"
                  class="tw-absolute tw-right-2.5 tw-top-1/2 -tw-translate-y-1/2 tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-slate-400 hover:tw-text-slate-600 hover:tw-bg-slate-100 tw-text-sm tw-leading-none tw-transition-colors"
                  @mousedown.prevent
                  @click="clearPatientSelection"
                >
                  ×
                </button>
                <ul
                  v-if="patientSearchOpen"
                  class="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-max-h-56 tw-overflow-auto tw-bg-white tw-border tw-border-slate-200 tw-rounded-lg tw-shadow-lg tw-list-none tw-py-1"
                >
                  <li
                    v-for="(p, i) in filteredPatients"
                    :key="p.user_id"
                    class="tw-px-3 tw-py-2 tw-cursor-pointer tw-text-sm hover:tw-bg-green-50"
                    :class="{ 'tw-bg-green-50': highlightedIndex === i }"
                    @mouseover="highlightedIndex = i"
                    @mousedown.prevent
                    @click="selectPatient(p)"
                  >
                    {{ p.full_name }} <span v-if="p.phone_number" class="tw-text-slate-400">({{ p.phone_number }})</span>
                  </li>
                  <li v-if="filteredPatients.length === 0" class="tw-px-3 tw-py-2 tw-text-sm tw-text-slate-400">
                    ไม่พบผู้ป่วยที่ค้นหา — สร้างบัญชีผู้ป่วยใหม่ด้านบนก่อน
                  </li>
                </ul>
              </div>
              <p class="tw-text-xs tw-text-gray-400 tw-mt-1">พิมพ์ชื่อ/นามสกุลเพื่อค้นหา — ต้องมีบัญชีก่อน (ผู้ป่วยสมัครเองไม่ได้)</p>
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
</div>

  <!-- ======= Popup "สร้างบัญชีผู้ป่วยสำเร็จ" ======= -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showCreatePopup"
        class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
      >
        <!-- Backdrop: คลิกนอก popup → ปิดทันที -->
        <div class="tw-fixed tw-inset-0 tw-bg-black/40 tw-backdrop-blur-sm" @click="closeCreatePopup"></div>

        <!-- Popup Content -->
        <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-sm tw-overflow-hidden tw-transform tw-transition-all tw-text-center">
          <button
            type="button"
            aria-label="ปิด"
            class="tw-absolute tw-top-3 tw-right-3 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-white/30 hover:tw-bg-white/60 tw-text-white tw-text-xl tw-leading-none tw-transition-colors"
            @click="closeCreatePopup"
          >
            ✕
          </button>
          <div class="tw-bg-gradient-to-r tw-from-green-500 tw-to-emerald-600 tw-px-6 tw-py-5">
            <div class="tw-w-14 tw-h-14 tw-mx-auto tw-rounded-full tw-bg-white tw-flex tw-items-center tw-justify-center tw-shadow">
              <span class="tw-text-2xl">✅</span>
            </div>
          </div>
          <div class="tw-px-6 tw-py-5">
            <h2 class="tw-text-lg tw-font-bold tw-text-gray-800">สร้างบัญชีผู้ป่วยสำเร็จ</h2>
            <p class="tw-text-sm tw-text-gray-500 tw-mt-2">เลือกผู้ป่วยคนนี้ในฟอร์มเพื่อกรอกข้อมูลใบนัดหมายต่อได้ทันที</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ======= Popup "สร้างใบนัดสำเร็จ" ======= -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showSuccessPopup"
        class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
      >
        <!-- Backdrop: คลิกนอก popup → ปิดทันที -->
        <div class="tw-fixed tw-inset-0 tw-bg-black/40 tw-backdrop-blur-sm" @click="closeSuccessPopup"></div>

        <!-- Popup Content -->
        <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-sm tw-overflow-hidden tw-transform tw-transition-all tw-text-center">
          <button
            type="button"
            aria-label="ปิด"
            class="tw-absolute tw-top-3 tw-right-3 tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-white/30 hover:tw-bg-white/60 tw-text-white tw-text-xl tw-leading-none tw-transition-colors"
            @click="closeSuccessPopup"
          >
            ✕
          </button>
          <div class="tw-bg-gradient-to-r tw-from-green-500 tw-to-emerald-600 tw-px-6 tw-py-5">
            <div class="tw-w-14 tw-h-14 tw-mx-auto tw-rounded-full tw-bg-white tw-flex tw-items-center tw-justify-center tw-shadow">
              <span class="tw-text-2xl">✅</span>
            </div>
          </div>
          <div class="tw-px-6 tw-py-5">
            <h2 class="tw-text-lg tw-font-bold tw-text-gray-800">สร้างใบนัดสำเร็จ</h2>
            <p v-if="createdQr" class="tw-text-xs tw-text-gray-400 tw-font-mono tw-break-all tw-mt-2">
              รหัส QR: {{ createdQr }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// ============================================================
// สิทธิ์เข้าถึง: เฉพาะ Clinic_staff / Admin เท่านั้นที่กรอกข้อมูลได้
// ============================================================

import { collapseSpaces } from '~/utils/name'

const { canCreate, refresh } = useSession()

// ============================================================
// State
// ============================================================

const form = ref({
  patient_user_id: null,
  license_plate: '',
  dept_id: null,
  appointment_date: '',
  time_slot: '',
})

const departmentList = ref([])
const patientList = ref([])
const isSubmitting = ref(false)

// ============================================================
// Searchable select — เลือกผู้ป่วย (autocomplete จาก /api/patients)
// ============================================================

const patientSearch = ref('')
const patientSearchOpen = ref(false)
const highlightedIndex = ref(-1)
// ข้อความที่แสดงตอนเลือกสำเร็จ — ใช้เช็คว่าผู้ใช้แก้กล่องค้นหาแล้วหรือยัง (ถ้าแก้แล้วให้ยกเลิกการเลือก)
let lastPatientSelectionText = ''

const patientDisplayName = (p) => (p.phone_number ? `${p.full_name} (${p.phone_number})` : p.full_name)

const filteredPatients = computed(() => {
  const q = patientSearch.value.trim().toLowerCase()
  if (!q) return patientList.value
  return patientList.value.filter((p) => {
    const name = (p.full_name || '').toLowerCase()
    const phone = p.phone_number ? String(p.phone_number) : ''
    return name.includes(q) || phone.includes(q)
  })
})

const selectPatient = (p) => {
  form.value.patient_user_id = p.user_id
  patientSearch.value = patientDisplayName(p)
  lastPatientSelectionText = patientSearch.value
  patientSearchOpen.value = false
  highlightedIndex.value = -1
}

// กด "×": ล้างผู้ป่วยที่เลือกกลับเป็น "-- เลือกผู้ป่วย --" แล้วค้นหาใหม่ได้ทันที
const clearPatientSelection = () => {
  form.value.patient_user_id = null
  patientSearch.value = ''
  lastPatientSelectionText = ''
  patientSearchOpen.value = false
  highlightedIndex.value = -1
}

const moveHighlight = (delta) => {
  const n = filteredPatients.value.length
  if (!n) return
  patientSearchOpen.value = true
  highlightedIndex.value = (highlightedIndex.value + delta + n) % n
}

const handlePatientEnter = () => {
  if (highlightedIndex.value >= 0) {
    selectPatient(filteredPatients.value[highlightedIndex.value])
  } else if (filteredPatients.value.length === 1) {
    selectPatient(filteredPatients.value[0])
  }
}

// ถ้าผู้ใช้แก้กล่องค้นหา (ต่างจากชื่อผู้ป่วยที่เลือกอยู่) → ยกเลิกผู้ป่วยที่เลือกไว้เพื่อกันส่ง ID ผิด
watch(patientSearch, (val) => {
  if (val !== lastPatientSelectionText && form.value.patient_user_id) {
    form.value.patient_user_id = null
  }
})

// ============================================================
// สร้างบัญชีผู้ป่วยใหม่ (Req: Clinic_staff เป็นผู้สร้าง Account ไม่ใช่ผู้ป่วยสมัครเอง)
// ============================================================

const isCreating = ref(false)
const createError = ref('')
const createForm = ref({
  first_name: '',
  last_name: '',
  phone_number: '',
})

const resetCreateForm = () => {
  createForm.value = {
    first_name: '',
    last_name: '',
    phone_number: '',
  }
  createError.value = ''
}

const fetchPatients = async () => {
  try {
    const data = await $fetch('/api/patients')
    patientList.value = data || []
  } catch (error) {
    console.error('โหลดข้อมูลบัญชีผู้ป่วยไม่สำเร็จ:', error)
  }
}

const handleCreateAccount = async () => {
  createError.value = ''
  const cf = createForm.value

  if (!cf.first_name.trim() || !cf.last_name.trim()) {
    createError.value = 'กรุณากรอกชื่อและนามสกุล'
    return
  }
  if (!/^\d{9,10}$/.test(cf.phone_number.trim())) {
    createError.value = 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก'
    return
  }

  isCreating.value = true
  try {
    const created = await $fetch('/api/patients', {
      method: 'POST',
      body: {
        first_name: cf.first_name.trim(),
        last_name: cf.last_name.trim(),
        phone_number: cf.phone_number.trim(),
      },
    })
    // Refresh รายชื่อผู้ป่วย + เลือกผู้ป่วยที่เพิ่งสร้างเป็นผู้ป่วยปัจจุบัน
    // (ใช้ user_id ที่ API ส่งกลับจริงจาก Response ของการสร้าง Account ไม่ใช่ index/รายการสุดท้าย)
    await fetchPatients()
    resetCreateForm()
    form.value.patient_user_id = created?.user_id || null
    // สะท้อนชื่อผู้ป่วยที่เพิ่งสร้างเป็นผู้ป่วยปัจจุบันในกล่องค้นหา
    patientSearch.value = created?.full_name ? patientDisplayName(created) : ''
    lastPatientSelectionText = patientSearch.value
    patientSearchOpen.value = false
    showCreateSuccess()
  } catch (error) {
    createError.value = error?.data?.statusMessage || error?.message || 'สร้างบัญชีไม่สำเร็จ'
    console.error('Create patient account error:', error)
  } finally {
    isCreating.value = false
  }
}

// ============================================================
// Popup "สร้างบัญชีผู้ป่วยสำเร็จ"
// - แสดงหลัง API /api/patients ตอบกลับสำเร็จ (HTTP 200)
// - แสดง 5 วินาที แล้วหายอัตโนมัติ
// - คลิกนอก popup → หายทันที
// - มีปุ่มปิด (✕) กดปิดได้ทันที
// ============================================================

const showCreatePopup = ref(false)
let createPopupTimer = null

const closeCreatePopup = () => {
  showCreatePopup.value = false
  if (createPopupTimer) {
    clearTimeout(createPopupTimer)
    createPopupTimer = null
  }
}

const showCreateSuccess = () => {
  // หากมี popup เก่าค้างอยู่ ให้ปิดก่อน (กันหลาย popup ซ้อนกัน)
  closeCreatePopup()
  showCreatePopup.value = true
  // 5 วินาที แล้วหายอัตโนมัติ
  createPopupTimer = setTimeout(() => {
    showCreatePopup.value = false
    createPopupTimer = null
  }, 5000)
}

// ============================================================
// Popup "สร้างใบนัดสำเร็จ" (Req 6/7 + Req 15)
// - แสดง 5 วินาที แล้วหายอัตโนมัติ
// - คลิกนอก popup → หายทันที
// - มีปุ่มปิด (✕) กดปิดได้ทันที
// - แสดงเฉพาะตอน API ยืนยันการสร้างสำเร็จ (HTTP 200)
// ============================================================

const showSuccessPopup = ref(false)
const createdQr = ref('')
let popupTimer = null

const closeSuccessPopup = () => {
  showSuccessPopup.value = false
  createdQr.value = ''
  if (popupTimer) {
    clearTimeout(popupTimer)
    popupTimer = null
  }
}

const showSuccess = (qrToken) => {
  // หากมี popup เก่าค้างอยู่ ให้ปิดก่อน (กันหลาย popup ซ้อนกัน)
  closeSuccessPopup()
  createdQr.value = qrToken || ''
  showSuccessPopup.value = true
  // 5 วินาที แล้วหายอัตโนมัติ
  popupTimer = setTimeout(() => {
    showSuccessPopup.value = false
    createdQr.value = ''
    popupTimer = null
  }, 5000)
}

onUnmounted(() => {
  if (popupTimer) clearTimeout(popupTimer)
  if (createPopupTimer) clearTimeout(createPopupTimer)
})

// ============================================================
// ดึงข้อมูลแผนกจาก Supabase (ผ่าน Nuxt Server API)
// ============================================================

const fetchDepartments = async () => {
  try {
    const data = await $fetch('/api/departments')
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
    // payload.patient_user_id = ผู้ป่วยที่เลือก (ต้องมีบัญชี)
    if (!payload.patient_user_id) {
      alert('กรุณาเลือกผู้ป่วยที่มีบัญชี')
      isSubmitting.value = false
      return
    }

    const res = await $fetch('/api/appointments', {
      method: 'POST',
      body: payload,
    })

    // แสดง Popup "สร้างใบนัดสำเร็จ" — ถึงตรงนี้ได้ก็ต่อเมื่อ API คืน success (HTTP 200)
    showSuccess(res?.data?.qr_token || '')

    // รีเซ็ตฟอร์ม
    form.value = {
      patient_user_id: null,
      license_plate: '',
      dept_id: null,
      appointment_date: '',
      time_slot: '',
    }
    patientSearch.value = ''
    lastPatientSelectionText = ''
    patientSearchOpen.value = false
    highlightedIndex.value = -1
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

onMounted(async () => {
  // รอ session โหลดก่อนตัดสินใจ (กัน redirect ผิดพลาด)
  await refresh()

  // ผู้ที่ไม่มีสิทธิ์สร้างใบนัด → ส่งกลับไปหน้ารายการนัด
  if (!canCreate.value) {
    navigateTo('/appointments')
    return
  }
  fetchDepartments()
  fetchPatients()
})
</script>