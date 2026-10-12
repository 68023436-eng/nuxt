<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-3 sm:tw-p-4">
        <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="close"></div>

        <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-max-h-[92vh] tw-flex tw-flex-col tw-overflow-hidden tw-transition-all">
          <div class="tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-px-5 sm:tw-px-6 tw-py-3.5 sm:tw-py-4 tw-flex tw-items-center tw-justify-between">
            <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-white">แก้ไขข้อมูลส่วนตัว</h2>
            <button @click="close" class="tw-text-white/80 hover:tw-text-white tw-transition-colors tw-text-2xl tw-leading-none tw-font-light tw-p-1">✕</button>
          </div>

          <div class="tw-px-4 sm:tw-px-6 tw-py-4 sm:tw-py-5 tw-space-y-4 tw-overflow-y-auto">
            <div v-if="formError" class="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-600 tw-text-xs sm:tw-text-sm tw-p-3 tw-rounded-xl">{{ formError }}</div>

            <div>
              <label class="tw-block tw-text-xs sm:tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">ชื่อ-นามสกุล <span class="tw-text-red-500">*</span></label>
              <input v-model="form.full_name" type="text" maxlength="100" placeholder="ชื่อ-นามสกุล"
                class="tw-w-full tw-border tw-border-slate-300 tw-p-2.5 sm:tw-p-3 tw-text-sm tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400" />
            </div>

            <div>
              <label class="tw-block tw-text-xs sm:tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">เบอร์โทรศัพท์</label>
              <input v-model="form.phone_number" type="tel" maxlength="10" inputmode="numeric" placeholder="เช่น 0909009090"
                class="tw-w-full tw-border tw-border-slate-300 tw-p-2.5 sm:tw-p-3 tw-text-sm tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400" />
            </div>

            <div>
              <label class="tw-block tw-text-xs sm:tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">อีเมล</label>
              <input v-model="form.email" type="email" maxlength="255" placeholder="example@mail.com"
                class="tw-w-full tw-border tw-border-slate-300 tw-p-2.5 sm:tw-p-3 tw-text-sm tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400" />
            </div>

            <div>
              <label class="tw-block tw-text-xs sm:tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
                รหัสผ่าน <span class="tw-text-[11px] sm:tw-text-xs tw-text-slate-400">(เว้นว่าง = ไม่เปลี่ยน)</span>
              </label>
              <input v-model="form.password" type="password" autocomplete="new-password" minlength="8" placeholder="อย่างน้อย 8 ตัวอักษร"
                class="tw-w-full tw-border tw-border-slate-300 tw-p-2.5 sm:tw-p-3 tw-text-sm tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400" />
            </div>

            <div class="tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-p-3 tw-text-[11px] sm:tw-text-xs tw-text-slate-600 tw-leading-relaxed">
              บทบาทของคุณ: <span class="tw-font-semibold tw-text-emerald-700">{{ roleLabel }}</span> —
              ไม่สามารถเปลี่ยนบทบาท/สิทธิ์ของตัวเองได้
            </div>
          </div>

          <div class="tw-px-4 sm:tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-flex-col-reverse sm:tw-flex-row tw-justify-end tw-gap-2 sm:tw-gap-3">
            <button @click="close" :disabled="saving"
              class="tw-w-full sm:tw-w-auto tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors">
              ยกเลิก
            </button>
            <button @click="save" :disabled="saving"
              class="tw-w-full sm:tw-w-auto tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-6 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm">
              {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { roleLabel, refresh } = useSession()

const loading = ref(false)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  full_name: '',
  phone_number: '',
  email: '',
  password: '',
})

const close = () => emit('update:modelValue', false)

// โหลดข้อมูลล่าสุดทุกครั้งที่เปิด
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    formError.value = ''
    loading.value = true
    try {
      const me = await $fetch('/api/me')
      form.full_name = me?.full_name || ''
      form.phone_number = me?.phone_number || ''
      form.email = me?.email || ''
      form.password = ''
    } catch (error) {
      formError.value = error?.data?.statusMessage || error?.message || 'ไม่สามารถโหลดข้อมูลได้'
    } finally {
      loading.value = false
    }
  }
)

const save = async () => {
  formError.value = ''
  if (!form.full_name.trim()) {
    formError.value = 'กรุณากรอกชื่อ-นามสกุล'
    return
  }
  const phone = form.phone_number.trim()
  if (phone && !/^\d{9,10}$/.test(phone)) {
    formError.value = 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก'
    return
  }
  const email = form.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formError.value = 'รูปแบบอีเมลไม่ถูกต้อง'
    return
  }
  if (form.password && form.password.length < 8) {
    formError.value = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    return
  }

  saving.value = true
  try {
    await $fetch('/api/me', {
      method: 'PUT',
      body: {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        email: form.email.trim(),
        password: form.password || undefined,
      },
    })
    await refresh()
    emit('saved')
    close()
  } catch (error) {
    formError.value = error?.data?.statusMessage || error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    saving.value = false
  }
}
</script>