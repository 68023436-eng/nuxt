<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="tw-flex-1 tw-min-w-0 tw-p-4 md:tw-p-8">
      <!-- Header Banner พร้อมปุ่มเพิ่ม -->
      <div class="tw-flex tw-flex-col md:tw-flex-row tw-gap-4 md:tw-items-center md:tw-justify-between tw-bg-emerald-100 tw-border-l-8 tw-border-l-emerald-500 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
        <div>
          <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">จัดการเจ้าหน้าที่</h1>
          <p class="tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">Manage Staff Accounts &amp; Access</p>
        </div>
        <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <button
            @click="fetchStaff"
            :disabled="loading"
            class="tw-bg-white hover:tw-bg-emerald-50 disabled:tw-bg-gray-100 tw-text-emerald-800 tw-border tw-border-emerald-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
          >
            <span>{{ loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}</span>
          </button>
          <button
            @click="openCreate"
            class="tw-bg-emerald-600 hover:tw-bg-emerald-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
          >
            + เพิ่มเจ้าหน้าที่
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="tw-text-center tw-py-12">
        <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-emerald-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
        <p class="tw-text-gray-500 tw-text-lg tw-mt-3">กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
        <p>เกิดข้อผิดพลาด: {{ errorMsg }}</p>
        <button @click="fetchStaff" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800">ลองอีกครั้ง</button>
      </div>

      <!-- Empty -->
      <div v-else-if="staffList.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
        <p class="tw-text-gray-400 tw-text-lg">ยังไม่มีเจ้าหน้าที่ในระบบ</p>
        <p class="tw-text-gray-400 tw-text-sm tw-mt-1">กดปุ่ม "+ เพิ่มเจ้าหน้าที่" เพื่อสร้างบัญชีแรก</p>
      </div>

      <!-- Table -->
      <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
        <div class="tw-overflow-x-auto">
        <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[900px]">
          <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
            <tr>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-12">ลำดับ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[220px]">ชื่อ-นามสกุล</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[150px]">บทบาท</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[130px]">เบอร์โทร</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[220px]">อีเมล</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[110px]">สถานะ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[190px] tw-text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in staffList"
              :key="item.user_id"
              :class="{ 'tw-bg-slate-50': isSelf(item) }"
              class="tw-border-b tw-border-slate-100 hover:tw-bg-slate-50 tw-transition-colors"
            >
              <td class="tw-px-5 tw-py-4 tw-text-gray-500 tw-whitespace-nowrap">{{ index + 1 }}</td>
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <div class="tw-flex tw-items-center tw-gap-2">
                  <span class="tw-font-medium tw-text-gray-800">{{ item.full_name }}</span>
                  <span v-if="isSelf(item)" class="tw-inline-block tw-bg-sky-100 tw-text-sky-700 tw-text-xs tw-font-medium tw-px-2 tw-py-0.5 tw-rounded-full">คุณ</span>
                </div>
              </td>
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <span :class="ROLE_BADGE_CLASSES[item.role] || 'tw-bg-slate-100 tw-text-slate-700'">{{ roleLabel(item.role) }}</span>
              </td>
              <td class="tw-px-5 tw-py-4 tw-text-gray-700 tw-whitespace-nowrap">{{ item.phone_number || '-' }}</td>
              <td class="tw-px-5 tw-py-4 tw-text-gray-700 tw-whitespace-nowrap">{{ item.email || '-' }}</td>
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <span :class="item.is_active ? 'tw-bg-emerald-100 tw-text-emerald-700' : 'tw-bg-gray-200 tw-text-gray-500'" class="tw-inline-block tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                  {{ item.is_active ? 'ใช้งาน' : 'ปิดใช้งาน' }}
                </span>
              </td>
              <td class="tw-px-5 tw-py-4 tw-text-center tw-whitespace-nowrap">
                <div class="tw-flex tw-justify-center tw-gap-2">
                  <button
                    @click="openEdit(item)"
                    :disabled="isSelf(item)"
                    class="tw-bg-blue-500 hover:tw-bg-blue-600 disabled:tw-bg-gray-200 disabled:tw-cursor-not-allowed tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                  >
                    แก้ไข
                  </button>
                  <button
                    v-if="!isSelf(item)"
                    @click="askDelete(item)"
                    :disabled="deletingId === item.user_id"
                    class="tw-bg-red-500 hover:tw-bg-red-600 disabled:tw-bg-gray-300 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                  >
                    {{ deletingId === item.user_id ? 'กำลังลบ...' : 'ลบ' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="tw-px-6 tw-py-3 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-sm tw-text-gray-500">
          ทั้งหมด {{ staffList.length }} รายการ (ไม่สามารถแก้ไข/ลบบัญชีของตัวเองได้)
        </div>
      </div>
    </div>

    <!-- ======= Create / Edit Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showForm" class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4">
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeForm"></div>
          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-overflow-hidden tw-transition-all">
            <div class="tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-px-6 tw-py-4 tw-flex tw-items-center tw-justify-between">
              <h2 class="tw-text-lg tw-font-bold tw-text-white">{{ editingId ? 'แก้ไขเจ้าหน้าที่' : 'เพิ่มเจ้าหน้าที่' }}</h2>
              <button @click="closeForm" class="tw-text-white/80 hover:tw-text-white tw-transition-colors tw-text-2xl tw-leading-none tw-font-light">✕</button>
            </div>

            <div class="tw-px-6 tw-py-5 tw-space-y-4">
              <div v-if="formError" class="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-600 tw-text-sm tw-p-3 tw-rounded-lg">{{ formError }}</div>

              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">ชื่อ-นามสกุล <span class="tw-text-red-500">*</span></label>
                <input v-model="form.full_name" type="text" maxlength="100" placeholder="ชื่อ-นามสกุล (ตรงกับชื่อที่ใช้ login ต้องไม่ซ้ำกับตำแหน่งนี้)"
                  class="tw-w-full tw-border tw-border-gray-300 tw-p-3 tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400" />
              </div>

              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">บทบาท <span class="tw-text-red-500">*</span></label>
                <select v-model="form.role"
                  class="tw-w-full tw-border tw-border-gray-300 tw-p-3 tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400 tw-bg-white">
                  <option v-for="r in STAFF_ROLES" :key="r" :value="r">{{ roleLabel(r) }}</option>
                </select>
              </div>

              <div class="tw-grid tw-grid-cols-2 tw-gap-4">
                <div>
                  <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">เบอร์โทร</label>
                  <input v-model="form.phone_number" type="tel" maxlength="10" inputmode="numeric" placeholder="เช่น 0909009090"
                    class="tw-w-full tw-border tw-border-gray-300 tw-p-3 tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400" />
                </div>
                <div>
                  <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
                    อีเมล <span v-if="!editingId" class="tw-text-red-500">*</span>
                  </label>
                  <input v-model="form.email" type="email" maxlength="255" placeholder="example@mail.com" :required="!editingId"
                    class="tw-w-full tw-border tw-border-gray-300 tw-p-3 tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400" />
                </div>
              </div>

              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
                  รหัสผ่าน <span class="tw-text-xs tw-text-slate-400">{{ editingId ? '(เว้นว่าง = ไม่เปลี่ยน)' : '' }}</span>
                </label>
                <input v-model="form.password" type="password" autocomplete="new-password" :required="!editingId" minlength="8" placeholder="อย่างน้อย 8 ตัวอักษร"
                  class="tw-w-full tw-border tw-border-gray-300 tw-p-3 tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400" />
              </div>

              <div class="tw-flex tw-items-center tw-gap-3">
                <label class="tw-flex tw-items-center tw-gap-2 tw-cursor-pointer tw-select-none">
                  <input v-model="form.is_active" type="checkbox" class="tw-w-4 tw-h-4 tw-accent-emerald-600" />
                  <span class="tw-text-sm tw-text-gray-700">เปิดใช้งานบัญชีนี้</span>
                </label>
              </div>
            </div>

            <div class="tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end tw-gap-3">
              <button @click="closeForm" :disabled="saving"
                class="tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors">
                ยกเลิก
              </button>
              <button @click="saveStaff" :disabled="saving"
                class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm">
                {{ saving ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเจ้าหน้าที่') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ======= Delete Confirm Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4">
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeDeleteModal"></div>
          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transition-all">
            <div class="tw-p-6 tw-text-center">
              <h3 class="tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-2">ยืนยันการลบเจ้าหน้าที่</h3>
              <p class="tw-text-sm tw-text-gray-600 tw-mb-3">
                คุณต้องการลบ
                <strong class="tw-text-gray-800 tw-font-semibold">{{ itemToDelete?.full_name }}</strong>
                ({{ itemToDelete ? roleLabel(itemToDelete.role) : '' }}) ใช่หรือไม่?
              </p>
              <p class="tw-text-xs tw-text-red-600 tw-bg-red-50 tw-p-2.5 tw-rounded-lg tw-border tw-border-red-200">
                เมื่อลบแล้วผู้ใช้รายนี้จะไม่สามารถเข้าสู่ระบบได้อีก การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div class="tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end tw-gap-3">
              <button @click="closeDeleteModal" :disabled="deletingId !== null"
                class="tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors">
                ยกเลิก
              </button>
              <button @click="confirmDelete" :disabled="deletingId !== null"
                class="tw-bg-red-600 hover:tw-bg-red-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm">
                {{ deletingId !== null ? 'กำลังลบ...' : 'ยืนยันลบ' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ROLE_LABELS, ROLE_BADGE_CLASSES, STAFF_ROLES } from '~/constants/roles'

// ============================================================
// Composables
// ============================================================

const { session, refresh } = useSession()

// ============================================================
// State
// ============================================================

const staffList = ref([])
const loading = ref(false)
const errorMsg = ref('')

const showForm = ref(false)
const showDeleteModal = ref(false)
const editingId = ref(null)
const saving = ref(false)
const deletingId = ref(null)
const formError = ref('')
const itemToDelete = ref(null)

const emptyForm = () => ({
  full_name: '',
  role: 'Clinic_staff',
  phone_number: '',
  email: '',
  password: '',
  is_active: true,
})

const form = reactive(emptyForm())

// ============================================================
// Helpers
// ============================================================

function roleLabel(role) {
  return ROLE_LABELS[role] || role
}

// บัญชีของตัวเอง = ชื่อ+บทบาทตรงกับ session (กันแก้ไข/ลบตัวเอง)
function isSelf(item) {
  const s = session.value
  if (!s) return false
  return item.full_name === s.full_name && item.role === s.role
}

// ============================================================
// Fetch
// ============================================================

const fetchStaff = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('/api/admin/staff', { method: 'GET' })
    staffList.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อดึงข้อมูลได้'
    console.error('Fetch staff error:', error)
  } finally {
    loading.value = false
  }
}

// ============================================================
// Create / Edit Modal
// ============================================================

const openCreate = () => {
  Object.assign(form, emptyForm())
  editingId.value = null
  formError.value = ''
  showForm.value = true
}

const openEdit = (item) => {
  Object.assign(form, {
    full_name: item.full_name,
    role: item.role,
    phone_number: item.phone_number || '',
    email: item.email || '',
    password: '',
    is_active: item.is_active,
  })
  editingId.value = item.user_id
  formError.value = ''
  showForm.value = true
}

const closeForm = () => {
  if (saving.value) return
  showForm.value = false
  editingId.value = null
}

const saveStaff = async () => {
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
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    formError.value = 'รูปแบบอีเมลไม่ถูกต้อง'
    return
  }
  if (!editingId.value && !form.email.trim()) {
    formError.value = 'จำเป็นต้องมีอีเมล (ใช้เป็นบัญชีในระบบ)'
    return
  }
  if (form.password && form.password.length < 8) {
    formError.value = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    return
  }
  if (!editingId.value && !form.password) {
    formError.value = 'ต้องกรอกรหัสผ่านเมื่อเพิ่มเจ้าหน้าที่ใหม่'
    return
  }

  saving.value = true
  try {
    const payload = {
      full_name: form.full_name.trim(),
      role: form.role,
      phone_number: form.phone_number.trim(),
      email: form.email.trim(),
      password: form.password || undefined,
      is_active: form.is_active,
    }

    if (editingId.value) {
      await $fetch(`/api/admin/staff/${editingId.value}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/staff', { method: 'POST', body: payload })
    }

    closeForm()
    await fetchStaff()
  } catch (error) {
    formError.value = error?.data?.statusMessage || error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่'
    console.error('Save staff error:', error)
  } finally {
    saving.value = false
  }
}

// ============================================================
// Delete
// ============================================================

const askDelete = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return
  const id = itemToDelete.value.user_id
  deletingId.value = id
  try {
    await $fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
    closeDeleteModal()
    await fetchStaff()
    alert('ลบเจ้าหน้าที่เรียบร้อยแล้ว')
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการลบ: ' + (error?.data?.statusMessage || error?.message || 'ไม่ทราบสาเหตุ'))
    console.error('Delete staff error:', error)
  } finally {
    deletingId.value = null
  }
}

// ============================================================
// Lifecycle
// ============================================================

onMounted(async () => {
  await refresh()
  if (session.value?.role !== 'Admin') {
    navigateTo('/appointments')
    return
  }
  fetchStaff()
})
</script>
