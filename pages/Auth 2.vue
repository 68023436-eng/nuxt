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

      <!-- ฟอร์มกรอกข้อมูล -->
      <form @submit.prevent="handleAuth" class="tw-space-y-4">
        <div>
          <label class="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">
            อีเมล (Email)
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="example@hospital.com"
            class="tw-w-full tw-px-4 tw-py-2.5 tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-text-sm focus:tw-outline-none focus:tw-border-amber-500 focus:tw-bg-white tw-transition"
          />
        </div>

        <div>
          <label class="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">
            รหัสผ่าน (Password)
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

        <template v-if="isSignUp">
          <div>
            <label class="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">
              ชื่อ-นามสกุล (Full Name)
            </label>
            <input
              v-model="fullName"
              type="text"
              required
              placeholder="สมชาย ใจดี"
              class="tw-w-full tw-px-4 tw-py-2.5 tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-text-sm focus:tw-outline-none focus:tw-border-amber-500 focus:tw-bg-white tw-transition"
            />
          </div>

          <div>
            <label class="tw-block tw-text-xs tw-font-semibold tw-text-gray-600 tw-uppercase tw-tracking-wider tw-mb-1.5">
              บทบาท (Role)
            </label>
            <select
              v-model="role"
              required
              class="tw-w-full tw-px-4 tw-py-2.5 tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-text-sm focus:tw-outline-none focus:tw-border-amber-500 focus:tw-bg-white tw-transition"
            >
              <option value="Security_guard">เจ้าหน้าที่ รปภ.</option>
              <option value="Clinic_staff">แพทย์/พยาบาล</option>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="patient">ผู้ป่วย / คนไข้</option>
            </select>
          </div>
        </template>

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
import { ref } from 'vue'

const client = useSupabaseClient()
const email = ref('')
const password = ref('')
const fullName = ref('')
const role = ref('staff')
const isSignUp = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  errorMsg.value = ''
}

const handleAuth = async () => {
  loading.value = true
  errorMsg.value = ''

  try {
    if (isSignUp.value) {
      // สมัครสมาชิกใหม่
      const { data, error } = await client.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            full_name: fullName.value,
            role: role.value
          }
        }
      })
      if (error) throw error

      if (data.user) {
        await client.from('hospital_user').upsert({
          user_id: data.user.id,
          full_name: fullName.value,
          role: role.value
        })
      }

      alert('สมัครสมาชิกสำเร็จ! กำลังพาท่านเข้าสู่ระบบ')
      navigateTo('/')
    } else {
      // เข้าสู่ระบบ
      const { data, error } = await client.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error

      if (data.user) {
        // ดึงข้อมูลใน hospital_user หรือสร้างใหม่ถ้ายังไม่มี
        const { data: existingUser } = await client
          .from('hospital_user')
          .select('full_name, role')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (!existingUser) {
          await client.from('hospital_user').upsert({
            user_id: data.user.id,
            full_name: data.user.user_metadata?.full_name || email.value.split('@')[0],
            role: data.user.user_metadata?.role || 'staff'
          })
        }
      }

      // เข้าสู่ระบบเสร็จให้เด้งไปหน้ารายการนัดหมาย
      navigateTo('/appointments')
    }
  } catch (err) {
    errorMsg.value = err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
  } finally {
    loading.value = false
  }
}
</script>