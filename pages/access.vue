<template>
  <div class="tw-min-h-[100dvh] tw-w-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-emerald-500 tw-via-teal-500 tw-to-cyan-600 tw-p-4 sm:tw-p-6 md:tw-p-8 tw-py-8 sm:tw-py-12">
    
    <div class="tw-w-full tw-max-w-md sm:tw-max-w-lg">
      
      <!-- แถบด้านบน: ปุ่มเลือกภาษา -->
      <div class="tw-flex tw-justify-end tw-mb-3 sm:tw-mb-4">
        <div class="tw-bg-white/90 tw-backdrop-blur-sm tw-rounded-xl tw-shadow-md tw-p-1">
          <LanguageSwitcher />
        </div>
      </div>

      <!-- กล่องการ์ดเข้าสู่ระบบ (Card) -->
      <div class="tw-bg-white tw-rounded-2xl sm:tw-rounded-3xl tw-shadow-2xl tw-p-5 sm:tw-p-8 md:tw-p-10 tw-border tw-border-white/20">
        
        <!-- Header ข้อความต้อนรับ -->
        <div class="tw-text-center tw-mb-5 sm:tw-mb-6">
          <h1 class="tw-text-xl sm:tw-text-2xl md:tw-text-3xl tw-font-bold tw-text-gray-800">{{ $t('access.title') }}</h1>
          <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mt-1">{{ $t('access.subtitle') }}</p>
          <p class="tw-text-[11px] sm:tw-text-xs tw-text-slate-400 tw-mt-1">{{ $t('access.desc') }}</p>
        </div>

        <!-- กล่องแจ้งเตือนข้อผิดพลาดรวม -->
        <div
          v-if="errorMsg"
          class="tw-mb-4 tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-600 tw-text-xs sm:tw-text-sm tw-p-3 sm:tw-p-3.5 tw-rounded-xl"
        >
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleLogin" class="tw-space-y-4 sm:tw-space-y-5">
          
          <!-- ช่องกรอก: ชื่อ-นามสกุล -->
          <div>
            <label class="tw-block tw-text-xs sm:tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-1.5">
              {{ $t('access.usernameLabel') }} <span class="tw-text-red-500">*</span>
            </label>
            <input
              v-model="form.full_name"
              type="text"
              required
              maxlength="100"
              :placeholder="$t('access.usernamePlaceholder')"
              autocomplete="name"
              @input="clearFieldError('full_name')"
              :class="[
                'tw-w-full tw-border tw-p-2.5 sm:tw-p-3 tw-text-sm tw-rounded-xl tw-outline-none focus:tw-ring-2 tw-bg-white tw-transition-colors',
                fieldError.full_name ? 'tw-border-red-400 focus:tw-ring-red-400' : 'tw-border-slate-300 focus:tw-ring-emerald-400'
              ]"
            />
            <p v-if="fieldError.full_name" class="tw-text-xs tw-text-red-500 tw-mt-1">{{ fieldError.full_name }}</p>
          </div>

          <!-- ช่องกรอก: เบอร์โทรศัพท์ -->
          <div>
            <label for="access-phone" class="tw-block tw-text-xs sm:tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-1.5">
              {{ $t('access.phoneLabel') }} <span class="tw-text-red-500">*</span>
            </label>
            <input
              id="access-phone"
              v-model="form.phone_number"
              type="tel"
              required
              autocomplete="tel"
              maxlength="10"
              pattern="[0-9]{9,10}"
              inputmode="numeric"
              :placeholder="$t('access.phonePlaceholder')"
              @input="clearFieldError('phone_number')"
              :class="[
                'tw-w-full tw-border tw-p-2.5 sm:tw-p-3 tw-text-sm tw-rounded-xl tw-outline-none focus:tw-ring-2 tw-bg-white tw-transition-colors',
                fieldError.phone_number ? 'tw-border-red-400 focus:tw-ring-red-400' : 'tw-border-slate-300 focus:tw-ring-emerald-400'
              ]"
            />
            <p v-if="fieldError.phone_number" class="tw-text-xs tw-text-red-500 tw-mt-1">{{ fieldError.phone_number }}</p>
          </div>

          <!-- หมายเหตุ: ระบบตรวจสอบสิทธิ์จากบัญชีในระบบโดยอัตโนมัติ -->
          <div class="tw-bg-emerald-50 tw-border tw-border-emerald-200 tw-rounded-xl tw-p-3 tw-text-[11px] sm:tw-text-xs tw-text-emerald-700 tw-leading-relaxed">
            {{ $t('access.roleDetectHint') }}
          </div>

          <!-- ปุ่มกดยืนยัน (Submit Button) -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="tw-w-full tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-semibold tw-py-3 sm:tw-py-3.5 tw-rounded-xl tw-shadow-md hover:tw-shadow-lg tw-transition-all tw-text-sm sm:tw-text-base tw-mt-2"
          >
            {{ isSubmitting ? $t('access.signingIn') : $t('access.signIn') }}
          </button>
        </form>

        <p class="tw-text-center tw-text-[11px] sm:tw-text-xs tw-text-slate-400 tw-mt-4 sm:tw-mt-5">
          {{ $t('access.staffNote') }}
        </p>

      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: false,
})

const { login, refresh } = useSession()

const form = reactive({
  full_name: '',
  phone_number: '',
})

const isSubmitting = ref(false)
const errorMsg = ref('')
const fieldError = ref({})

// เคลียร์ error เฉพาะฟิลด์ที่กำลังกรอก
const clearFieldError = (field) => {
  if (fieldError.value[field]) {
    delete fieldError.value[field]
  }
}

// นำทางตามบทบาทที่ได้จากบัญชี (รปภ. ไปหน้า verify / ส่วนที่เหลือไปหน้าหลัก)
const homePathFor = (role) => (role === 'Security_guard' ? '/verify' : '/')

// มี Session ค้างอยู่ ให้พาไปหน้าหลักทันที
onMounted(async () => {
  const s = await refresh()
  if (s) {
    navigateTo(homePathFor(s.role))
  }
})

const handleLogin = async () => {
  errorMsg.value = ''
  fieldError.value = {}
  isSubmitting.value = true

  try {
    // ส่งแค่ ชื่อ + เบอร์ — ระบบหาบัญชีและ role ให้เอง
    const s = await login({
      full_name: form.full_name,
      phone_number: form.phone_number,
    })
    navigateTo(homePathFor(s?.role))
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    isSubmitting.value = false
  }
}
</script>