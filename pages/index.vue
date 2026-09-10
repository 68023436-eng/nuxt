<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <Sidebar />

    <!-- Access denied -->
    <div v-if="!isAllowed" class="tw-flex-1 tw-p-8">
      <div class="tw-max-w-md tw-mx-auto tw-mt-20 tw-text-center">
        <div class="tw-w-20 tw-h-20 tw-bg-red-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
          <span class="tw-text-4xl">🔒</span>
        </div>
        <h2 class="tw-text-xl tw-font-bold tw-text-gray-800">ไม่มีสิทธิ์เข้าถึง Dashboard</h2>
        <p class="tw-text-sm tw-text-slate-500 tw-mt-2">สถิติรวมเปิดให้เฉพาะ Admin และเจ้าหน้าที่คลินิกเท่านั้น</p>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-else class="tw-flex-1 tw-p-4 sm:tw-p-8">
      <!-- Header Banner -->
      <div class=" tw-bg-blue-100 tw-border-l-8 tw-border-l-blue-500 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-6">
        <h1 class="tw-text-2xl tw-font-bold tw-text-black">แดชบอร์ดสรุปการใช้บริการ</h1>
        <p class="tw-text-sm tw-text-slate-500 tw-mt-1 tw-font-mono">Smart QR Parking — Dashboard</p>
      </div>

      <!-- Month Selector -->
      <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-mb-6">
        <label class="tw-text-sm tw-font-medium tw-text-gray-700" for="dash-month">เลือกเดือน:</label>
        <input
          id="dash-month"
          v-model="month"
          type="month"
          :disabled="loading"
          @change="loadStats"
          placeholder="yyyy-mm" 
          class="tw-px-3 tw-py-2 tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400"
        />
        <button
          @click="loadStats"
          :disabled="loading"
          class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-text-sm tw-font-semibold tw-py-2 tw-px-5 tw-rounded-xl tw-shadow-sm tw-transition-colors"
        >
          {{ loading ? 'กำลังโหลด...' : 'ดูข้อมูล' }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="tw-text-center tw-py-16 tw-text-slate-500">
        <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-emerald-300 tw-border-t-transparent tw-rounded-full tw-animate-spin tw-mb-3"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Error -->
      <p v-else-if="errorMsg" class="tw-text-center tw-text-sm tw-text-red-600 tw-my-10">⚠️ {{ errorMsg }}</p>

      <template v-else-if="stats">
        <!-- Stat Cards -->
        <div class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-5 tw-mb-8">
          <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-border-l-amber-400 tw-border-l-8 tw-p-6">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <span class="tw-text-xl">ยอดรวมทั้งหมด</span>
              <span class="tw-text-xs tw-text-slate-500 tw-bg-amber-100 tw-border-2 tw-border-amber-200 tw-px-2 tw-py-1 tw-rounded-full tw-font-mono">{{ stats.month }}</span>
            </div>
            <p class="tw-text-3xl tw-font-bold tw-text-gray-800">{{ stats.total_visits.toLocaleString() }}</p>
            <p class="tw-text-sm tw-text-slate-500 tw-mt-1">ครั้ง</p>
          </div>

          <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-border-l-8 tw-border-l-purple-400 tw-p-6">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <span class="tw-text-xl">ยอดผู้เข้ารับบริการ</span>
              <span class="tw-text-xs tw-text-slate-500 tw-bg-purple-100 tw-px-2 tw-py-1 tw-rounded-full tw-border-2 tw-border-purple-200 tw-font-mono">เฉพาะบุคคล</span>
            </div>
            <p class="tw-text-3xl tw-font-bold tw-text-gray-800">{{ stats.total_visitors.toLocaleString() }}</p>
            <p class="tw-text-sm tw-text-slate-500 tw-mt-1">คน</p>
          </div>

          <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-border-l-8 tw-border-l-emerald-400 tw-p-6">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <span class="tw-text-xl">จำนวนเจ้าหน้าที่</span>
              <span class="tw-text-xs tw-text-slate-500 tw-bg-emerald-100 tw-px-2 tw-py-1 tw-rounded-full tw-border-2 tw-border-emerald-200 tw-font-mono">ทั้งหมด</span>
            </div>
            <p class="tw-text-3xl tw-font-bold tw-text-gray-800">{{ stats.staff_count.toLocaleString() }}</p>
            <p class="tw-text-sm tw-text-slate-500 tw-mt-1">จำนวนเจ้าหน้าที่</p>
          </div>
        </div>

        <!-- ข้อมูลนี้ไม่ขึ้นกับเดือน (เจ้าหน้าที่ทั้งหมด) -->
        <p class="tw-text-xs tw-text-slate-400 tw-mb-4">* จำนวนเจ้าหน้าที่ = ยอดรวมปัจจุบันทั้งหมดอิสระจากเดือนที่เลือก</p>

        <!-- Top Departments -->
        <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-p-6">
          <h2 class="tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-1">แผนกที่มาใช้บริการบ่อย</h2>
          <p class="tw-text-sm tw-text-slate-500 tw-mb-5">เดือน {{ stats.month }} — เรียงตามจำนวนการใช้บริการ</p>

          <div v-if="stats.top_departments.length === 0" class="tw-text-sm tw-text-slate-400 tw-py-6 tw-text-center">
            ยังไม่มีข้อมูลในเดือนนี้
          </div>

          <template v-else>
            <div
              v-for="(dept, idx) in stats.top_departments"
              :key="dept.name"
              class="tw-flex tw-items-center tw-gap-4 tw-py-3 tw-border-b tw-border-slate-100 last:tw-border-0"
            >
              <span class="tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-sm"
                :class="rankClass(idx)">
                {{ idx + 1 }}
              </span>
              <div class="tw-flex-1 tw-min-w-0">
                <p class="tw-font-semibold tw-text-gray-800 tw-truncate">{{ dept.name }}</p>
                <div class="tw-h-2 tw-rounded-full tw-bg-slate-100 tw-mt-1.5 tw-overflow-hidden">
                  <div
                    class="tw-h-full tw-rounded-full tw-bg-gradient-to-r tw-from-emerald-400 tw-to-teal-500"
                    :style="{ width: barWidth(dept.count) }"
                  ></div>
                </div>
              </div>
              <span class="tw-text-sm tw-font-bold tw-text-gray-700 tw-whitespace-nowrap">{{ dept.count }} ครั้ง</span>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
// ============================================================
// Role guard — Dashboard เฉพาะ Admin / Clinic_staff
// ============================================================

const { role } = useSession()
const isAllowed = computed(() => role.value === 'Admin' || role.value === 'Clinic_staff')

// ============================================================
// State
// ============================================================

const now = new Date()
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

const month = ref(currentMonth)
const stats = ref(null)
const loading = ref(false)
const errorMsg = ref('')

// ============================================================
// Actions
// ============================================================

const loadStats = async () => {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch('/api/dashboard/stats', {
      query: { month: month.value },
    })
    stats.value = res
  } catch (err) {
    stats.value = null
    errorMsg.value = err?.data?.statusMessage || err?.message || 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้'
  } finally {
    loading.value = false
  }
}

const barWidth = (count) => {
  const max = stats.value?.top_departments?.[0]?.count || 1
  if (!max) return '0%'
  const pct = Math.round((count / max) * 100)
  return `${Math.max(pct, 4)}%`
}

const rankClass = (idx) => {
  const base = 'tw-text-white '
  if (idx === 0) return base + 'tw-bg-amber-400'
  if (idx === 1) return base + 'tw-bg-slate-400'
  if (idx === 2) return base + 'tw-bg-orange-400'
  return base + 'tw-bg-slate-200 tw-text-gray-600'
}

onMounted(() => {
  if (isAllowed.value) {
    loadStats()
  }
})
</script>
