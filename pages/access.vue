<template>
  <div class="tw-min-h-screen tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-emerald-500 tw-via-teal-500 tw-to-cyan-600 tw-p-4">
    <div class="tw-w-full tw-max-w-md">
      <!-- Logo -->
      

      <!-- Card -->
      <div class="tw-bg-white tw-rounded-3xl tw-shadow-2xl tw-p-8">
        <div class="tw-text-center tw-mb-6">
          <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">ระบบสิทธิ์เข้าถึง</h1>
          <p class="tw-text-sm tw-text-slate-500 tw-mt-1">Hospital Appointment &amp; Parking Access</p>
          <p class="tw-text-xs tw-text-slate-400 tw-mt-1">ระบุตัวตนด้วย ชื่อ, เบอร์โทร และเลือกบทบาท</p>
        </div>

        <!-- Error -->
        <div
          v-if="errorMsg"
          class="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-600 tw-text-sm tw-p-3 tw-rounded-lg"
        >
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleLogin" class="tw-space-y-5">
          <!-- ชื่อผู้ใช้ -->
          <div>
            <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              ชื่อผู้ใช้ <span class="tw-text-red-500">*</span>
            </label>
            <input
              v-model="form.full_name"
              type="text"
              required
              maxlength="100"
              placeholder="ชื่อ-นามสกุล"
              class="tw-w-full tw-border tw-border-gray-300 tw-p-3 tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400"
            />
          </div>

          <!-- เบอร์โทรศัพท์ -->
          <div>
            <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              เบอร์โทรศัพท์ <span class="tw-text-red-500">*</span>
            </label>
            <input
              v-model="form.phone_number"
              type="tel"
              required
              maxlength="10"
              pattern="[0-9]{9,10}"
              placeholder="เช่น 0909009090"
              class="tw-w-full tw-border tw-border-gray-300 tw-p-3 tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400"
            />
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
                :class="[
                  'tw-relative tw-rounded-xl tw-border tw-p-3 tw-text-left tw-transition-all tw-flex tw-flex-col tw-gap-1',
                  form.role === opt.value
                    ? `tw-bg-gradient-to-br ${ROLE_COLORS[opt.value]} tw-border-transparent tw-text-white tw-shadow-lg`
                    : 'tw-bg-white tw-border-slate-200 tw-text-gray-700 hover:tw-border-emerald-300 hover:tw-bg-emerald-50/50',
                ]"
                @click="form.role = opt.value"
              >
                <span v-if="form.role === opt.value" class="tw-absolute tw-top-2 tw-right-2 tw-text-white tw-text-xs">✓</span>
                <span class="tw-text-lg">{{ ROLE_ICONS[opt.value] }}</span>
                <span class="tw-font-semibold tw-text-sm">{{ opt.label }}</span>
                <span :class="['tw-text-xs', form.role === opt.value ? 'tw-text-white/85' : 'tw-text-slate-400']">
                  {{ opt.desc }}
                </span>
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="tw-w-full tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-semibold tw-py-3.5 tw-rounded-xl tw-shadow-lg tw-transition tw-mt-2"
          >
            {{ isSubmitting ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ' }}
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
import { ROLE_COLORS } from '~/constants/roles'

definePageMeta({
  middleware: false,
})

const ROLE_ICONS = {
  Admin: '👑',
  Clinic_staff: '🩺',
  Security_guard: '🛡️',
  Patient: '👤',
}

const { login, refresh } = useSession()
const roleOptions = useRoleOptions()

const form = reactive({
  full_name: '',
  phone_number: '',
  role: 'Patient',
})

const isSubmitting = ref(false)
const errorMsg = ref('')

// ถ้ามี session อยู่แล้ว (เช่นกลับมาที่หน้า access) ข้ามไปหน้าใบนัดทันที
onMounted(async () => {
  const s = await refresh()
  if (s) {
    navigateTo('/appointments')
  }
})

const handleLogin = async () => {
  errorMsg.value = ''
  isSubmitting.value = true
  try {
    await login({ ...form })
    navigateTo('/appointments')
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    isSubmitting.value = false
  }
}
</script>