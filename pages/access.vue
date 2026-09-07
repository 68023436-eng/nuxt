<template>
  <div class="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-emerald-500 tw-via-teal-500 tw-to-cyan-600 tw-p-4">
    <div class="tw-w-full tw-max-w-md">
      <!-- Card -->
      <div class="tw-bg-white tw-rounded-3xl tw-shadow-2xl tw-p-6 sm:tw-p-8">
        <div class="tw-text-center tw-mb-6">
          <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">ระบบสิทธิ์เข้าถึง</h1>
          <p class="tw-text-sm tw-text-slate-500 tw-mt-1">Hospital Appointment &amp; Parking Access</p>
          <p class="tw-text-xs tw-text-slate-400 tw-mt-1">ระบุตัวตนด้วย ชื่อ, เบอร์โทร และเลือกบทบาท</p>
        </div>

        <!-- Error banner -->
        <div
          v-if="errorMsg"
          role="alert"
          class="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-600 tw-text-sm tw-p-3 tw-rounded-lg"
        >
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleLogin" novalidate class="tw-space-y-5">
          <!-- ชื่อผู้ใช้ -->
          <div>
            <label for="access-full-name" class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              ชื่อผู้ใช้ <span class="tw-text-red-500">*</span>
            </label>
            <input
              id="access-full-name"
              v-model="form.full_name"
              type="text"
              autocomplete="name"
              maxlength="100"
              placeholder="ชื่อ-นามสกุล"
              :class="inputClass(fieldError.full_name)"
              @input="clearFieldError('full_name')"
            />
            <p v-if="fieldError.full_name" class="tw-text-xs tw-text-red-500 tw-mt-1">{{ fieldError.full_name }}</p>
          </div>

          <!-- เบอร์โทรศัพท์ -->
          <div>
            <label for="access-phone" class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              เบอร์โทรศัพท์ <span class="tw-text-red-500">*</span>
            </label>
            <input
              id="access-phone"
              v-model="form.phone_number"
              type="tel"
              autocomplete="tel"
              maxlength="10"
              placeholder="เช่น 0909009090"
              inputmode="numeric"
              :class="inputClass(fieldError.phone_number)"
              @input="clearFieldError('phone_number')"
            />
            <p v-if="fieldError.phone_number" class="tw-text-xs tw-text-red-500 tw-mt-1">{{ fieldError.phone_number }}</p>
          </div>

          <!-- เลือกบทบาท (switch buttons) -->
          <div>
            <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              เลือกบทบาท <span class="tw-text-red-500">*</span>
            </label>
            <div class="tw-grid tw-grid-cols-2 tw-gap-2.5" role="radiogroup" aria-label="เลือกบทบาท">
              <button
                v-for="opt in roleOptions"
                :key="opt.value"
                type="button"
                role="radio"
                :aria-checked="form.role === opt.value"
                :class="roleButtonClass(opt.value, form.role === opt.value)"
                @click="selectRole(opt.value)"
              >
                <span v-if="form.role === opt.value" class="tw-absolute tw-top-2 tw-right-2 tw-text-white tw-text-xs">✓</span>
                <span class="tw-text-lg">{{ ROLE_ICONS[opt.value] }}</span>
                <span class="tw-font-semibold tw-text-sm">{{ opt.label }}</span>
                <span :class="form.role === opt.value ? 'tw-text-white/85' : 'tw-text-slate-400'">
                  {{ opt.desc }}
                </span>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="tw-w-full tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-semibold tw-py-3.5 tw-rounded-xl tw-shadow-lg tw-transition tw-mt-2 tw-flex tw-items-center tw-justify-center tw-gap-2"
          >
            <span v-if="isSubmitting" class="tw-inline-block tw-w-4 tw-h-4 tw-border-2 tw-border-white/60 tw-border-t-transparent tw-rounded-full tw-animate-spin"></span>
            <span>{{ isSubmitting ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ' }}</span>
          </button>
        </form>

        <p class="tw-text-center tw-text-xs tw-text-slate-400 tw-mt-5">
          เจ้าหน้าที่ต้องใช้ชื่อที่ตรงกับข้อมูลในระบบ
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ROLE_COLORS, ROLE_ICONS } from '~/constants/roles'

definePageMeta({
  middleware: false,
})

const { session, login } = useSession()

// ข้อมูล role สำหรับแสดงเป็น switch button
const roleOptions = useRoleOptions()

// แบบฟอร์ม + สถานะ
const form = reactive({
  full_name: '',
  phone_number: '',
  role: 'Patient',
})

const fieldError = reactive({
  full_name: '',
  phone_number: '',
})

const isSubmitting = ref(false)
const errorMsg = ref('')

// ถ้ามี session อยู่แล้ว (เช่นกลับมาที่หน้า access) ข้ามไปหน้าใบนัดทันที
onMounted(async () => {
  if (session.value) {
    navigateTo('/appointments')
  }
})

// ============================================================
// Validation ฝั่ง client (กันส่งข้อมูลไม่ครบ/รูปแบบผิด)
// ============================================================

const clearFieldError = (field) => {
  fieldError[field] = ''
}

const validate = () => {
  let ok = true
  fieldError.full_name = form.full_name.trim() ? '' : 'กรุณากรอกชื่อผู้ใช้'
  if (!fieldError.full_name) ok = ok

  const phone = form.phone_number.trim()
  if (!phone) {
    fieldError.phone_number = 'กรุณากรอกเบอร์โทรศัพท์'
    ok = false
  } else if (!/^\d{9,10}$/.test(phone)) {
    fieldError.phone_number = 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลักเท่านั้น'
    ok = false
  } else {
    fieldError.phone_number = ''
  }

  // role ต้องเป็นค่าในรายการที่อนุญาต (กันส่งค่าผิดเข้าไป)
  if (!roleOptions.some(r => r.value === form.role)) {
    form.role = 'Patient'
  }

  return ok && !fieldError.full_name
}

// ============================================================
// Handlers
// ============================================================

const selectRole = (role) => {
  form.role = role
  errorMsg.value = ''
}

const inputClass = (hasError) => [
  'tw-w-full tw-border tw-p-3 tw-rounded-xl tw-outline-none tw-transition-colors',
  hasError
    ? 'tw-border-red-400 focus:tw-ring-2 focus:tw-ring-red-300'
    : 'tw-border-gray-300 focus:tw-ring-2 focus:tw-ring-emerald-400',
]

const roleButtonClass = (role, isActive) => [
  'tw-relative tw-rounded-xl tw-border tw-p-3 tw-text-left tw-transition-all tw-flex tw-flex-col tw-gap-1',
  isActive
    ? `tw-bg-gradient-to-br ${ROLE_COLORS[role]} tw-border-transparent tw-text-white tw-shadow-lg`
    : 'tw-bg-white tw-border-slate-200 tw-text-gray-700 hover:tw-border-emerald-300 hover:tw-bg-emerald-50/50',
]

const handleLogin = async () => {
  errorMsg.value = ''

  // ตรวจข้อมูลก่อนส่งจริง
  if (!validate()) return

  isSubmitting.value = true
  try {
    await login({ ...form })
    // ใช้ navigateTo หลัง login สำเร็จ — ถ้าอยู่หน้าเดิมให้ไปหน้าใบนัด
    if (useRoute().path === '/access') {
      await navigateTo('/appointments')
    }
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    isSubmitting.value = false
  }
}
</script>
