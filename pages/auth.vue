<template>
  <div class="tw-min-h-screen tw-bg-slate-100 tw-flex tw-items-center tw-justify-center tw-p-4">
    <div class="tw-bg-white tw-w-full tw-max-w-md tw-rounded-2xl tw-shadow-xl tw-border tw-border-slate-100 tw-p-8">
      <!-- หัวข้อฟอร์ม -->
      <div class="tw-text-center tw-mb-8">
        <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">
          {{ isSignUp ? 'สร้างบัญชีผู้ใช้ใหม่' : 'เข้าสู่ระบบโรงพยาบาล' }}
        </h1>
        <p class="tw-text-sm tw-text-gray-500 tw-mt-1">
          ระบบจัดการใบนัดและสิทธิ์ที่จอดรถ
        </p>
      </div>

      <!-- กล่องแจ้งเตือน Error -->
      <div v-if="errorMsg" class="tw-mb-5 tw-p-3.5 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-xl tw-text-red-600 tw-text-xs">
        ⚠️ {{ errorMsg }}
      </div>

      <!-- กล่องแจ้ง Success (สำหรับ Sign Up สำเร็จ) -->
      <div v-if="successMsg" class="tw-mb-5 tw-p-3.5 tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-xl tw-text-green-700 tw-text-xs">
        ✅ {{ successMsg }}
      </div>

      <!-- ฟอร์มกรอกข้อมูล -->
      <form @submit.prevent="handleAuth" class="tw-space-y-4">
        <!-- 1. ช่องกรอก ชื่อ-นามสกุล (แสดงเฉพาะตอนสมัครสมาชิก) -->
        <div v-if="isSignUp">
          <label class="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">
            ชื่อ - นามสกุล *
          </label>
          <input
            v-model="fullName"
            type="text"
            required
            placeholder="นพ. สมชาย ใจดี หรือ สมหญิง รักษา"
            class="tw-w-full tw-px-4 tw-py-2.5 tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-text-sm focus:tw-outline-none focus:tw-border-amber-500 focus:tw-bg-white tw-transition"
          />
        </div>

        <!-- 2. ตัวเลือก Role / ตำแหน่ง (แสดงเฉพาะตอนสมัครสมาชิก) -->
        <div v-if="isSignUp">
          <label class="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">
            บทบาท / ตำแหน่ง *
          </label>
          <select
            v-model="role"
            required
            class="tw-w-full tw-px-4 tw-py-2.5 tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-text-sm focus:tw-outline-none focus:tw-border-amber-500 focus:tw-bg-white tw-transition text-gray-700"
          >
            <option value="doctor">🩺 แพทย์ (Doctor)</option>
            <option value="nurse">💉 พยาบาล (Nurse)</option>
            <option value="staff">💼 เจ้าหน้าที่ รปภ. / แผนก (Staff)</option>
            <option value="admin">🛡️ ผู้ดูแลระบบ (Admin)</option>
            <option value="patient">👤 ผู้ป่วย / ประชาชนทั่วไป (Patient)</option>
          </select>
        </div>

        <!-- 3. อีเมล -->
        <div>
          <label class="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">
            อีเมล (Email) *
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="example@hospital.com"
            class="tw-w-full tw-px-4 tw-py-2.5 tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-text-sm focus:tw-outline-none focus:tw-border-amber-500 focus:tw-bg-white tw-transition"
          />
        </div>

        <!-- 4. รหัสผ่าน -->
        <div>
          <label class="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">
            รหัสผ่าน (Password) *
          </label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="••••••••"
            class="tw-w-full tw-px-4 tw-py-2.5 tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-text-sm focus:tw-outline-none focus:tw-border-amber-500 focus:tw-bg-white tw-transition"
          />
        </div>

        <!-- ปุ่ม Action หลัก -->
        <button
          type="submit"
          :disabled="loading"
          class="tw-w-full tw-mt-2 tw-py-3 tw-bg-amber-500 hover:tw-bg-amber-600 disabled:tw-bg-amber-300 tw-text-white tw-font-semibold tw-rounded-xl tw-text-sm tw-shadow-md tw-transition duration-150"
        >
          {{ loading ? 'กำลังดำเนินการ...' : (isSignUp ? 'ยืนยันการสมัคร' : 'เข้าสู่ระบบ') }}
        </button>
      </form>

      <!-- สลับโหมด เข้าสู่ระบบ / สมัครสมาชิก -->
      <div class="tw-mt-6 tw-text-center">
        <button
          @click="toggleMode"
          type="button"
          class="tw-text-xs tw-text-slate-500 hover:tw-text-amber-600 tw-transition"
        >
          {{ isSignUp ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่' : 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

definePageMeta({
  middleware: [],
})

const client = useSupabaseClient()
const user = useSupabaseUser()

// State ฟอร์ม
const fullName = ref('')
const role = ref('staff') // ค่าเริ่มต้นเป็น เจ้าหน้าที่
const email = ref('')
const password = ref('')
const isSignUp = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(() => {
  if (user.value) {
    navigateTo('/appointments')
  }
})

watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/appointments')
  }
})

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  errorMsg.value = ''
  successMsg.value = ''
}

const translateError = (message) => {
  const errorMap = {
    'Invalid login credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง',
    'Email not confirmed': 'อีเมลยังไม่ได้รับการยืนยัน กรุณาตรวจสอบกล่องข้อความในอีเมลของท่าน',
    'User already registered': 'อีเมลนี้ถูกใช้สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบแทน',
    'Signup requires a valid password': 'กรุณากรอกรหัสผ่านที่ถูกต้อง (อย่างน้อย 6 ตัวอักษร)',
    'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    'Unable to validate email address: invalid format': 'รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
    'Email rate limit exceeded': 'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
    'For security purposes, you can only request this after': 'เพื่อความปลอดภัย กรุณารอสักครู่แล้วลองใหม่',
  }

  for (const [key, value] of Object.entries(errorMap)) {
    if (message?.includes(key)) return value
  }

  return message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองอีกครั้ง'
}

const handleAuth = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (isSignUp.value) {
      // 1. สั่งสมัครสมาชิกกับ Supabase Auth พร้อมฝากชื่อและ Role เข้า Metadata
      const { data, error } = await client.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            full_name: fullName.value,
            role: role.value,
          }
        }
      })
      if (error) throw error

      // 2. บันทึกข้อมูลลงตาราง hospital_user ทันที
      if (data?.user) {
        const { error: dbError } = await client
          .from('hospital_user')
          .insert({
            user_id: data.user.id,
            full_name: fullName.value,
            role: role.value,
          })

        if (dbError) {
          console.error('บันทึกลงตาราง hospital_user ไม่สำเร็จ:', dbError.message)
        }
      }

      if (data?.user && !data?.session) {
        successMsg.value = 'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี'
        email.value = ''
        password.value = ''
        fullName.value = ''
      } else {
        navigateTo('/appointments')
      }
    } else {
      // เข้าสู่ระบบตามปกติ
      const { error } = await client.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      navigateTo('/appointments')
    }
  } catch (err) {
    errorMsg.value = translateError(err.message)
  } finally {
    loading.value = false
  }
}
</script>