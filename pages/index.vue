<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- 1. กรณีไม่มีสิทธิ์เข้าถึง (Access denied) -->
    <div v-if="!isAllowed" class="tw-flex-1 tw-min-w-0 tw-p-4 sm:tw-p-8 tw-pt-16 md:tw-pt-8">
      <div class="tw-max-w-md tw-mx-auto tw-mt-12 sm:tw-mt-20 tw-text-center tw-bg-white tw-p-6 sm:tw-p-8 tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200">
        <div class="tw-w-16 sm:tw-w-20 tw-h-16 sm:tw-h-20 tw-bg-red-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-4">
          <span class="tw-text-3xl sm:tw-text-4xl">🔒</span>
        </div>
        <h2 class="tw-text-lg sm:tw-text-xl tw-font-bold tw-text-gray-800">{{ $t('index.noAccessTitle') }}</h2>
        <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mt-2">{{ $t('index.noAccessDesc') }}</p>
      </div>
    </div>

    <!-- 2. ส่วนแสดงผล Dashboard สถิติ -->
    <main v-else class="tw-flex-1 tw-min-w-0 tw-p-4 sm:tw-p-6 md:tw-p-8 tw-pt-16 md:tw-pt-8">
      
      <!-- Header Banner -->
      <div class="tw-bg-blue-100 tw-border-l-8 tw-border-l-blue-500 tw-p-4 sm:tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-6">
        <h1 class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-black">{{ $t('index.title') }}</h1>
        <p class="tw-text-xs sm:tw-text-sm tw-text-slate-600 tw-mt-1 tw-font-mono">{{ $t('index.subtitle') }}</p>
      </div>

      <!-- Month Selector & Action -->
      <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-gap-3 tw-mb-6 tw-bg-white tw-p-3.5 sm:tw-p-4 tw-rounded-xl tw-border tw-border-slate-200/80 tw-shadow-sm">
        <label class="tw-text-xs sm:tw-text-sm tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap" for="dash-month">
          {{ $t('index.selectMonth') }}
        </label>
        
        <div class="tw-flex tw-flex-col sm:tw-flex-row tw-items-stretch sm:tw-items-center tw-gap-2.5 tw-w-full sm:tw-w-auto">
          <input
            id="dash-month"
            v-model="month"
            type="month"
            :disabled="loading"
            @change="loadStats"
            placeholder="yyyy-mm" 
            class="tw-w-full sm:tw-w-auto tw-px-3 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400 disabled:tw-bg-slate-100"
          />
          <button
            @click="loadStats"
            :disabled="loading"
            class="tw-w-full sm:tw-w-auto tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-text-sm tw-font-semibold tw-py-2 tw-px-5 tw-rounded-xl tw-shadow-sm tw-transition-colors tw-flex tw-items-center tw-justify-center"
          >
            {{ loading ? $t('common.loading') :$t('index.viewData') }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="tw-text-center tw-py-16 tw-text-slate-500">
        <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-emerald-400 tw-border-t-transparent tw-rounded-full tw-animate-spin tw-mb-3"></div>
        <p class="tw-text-sm sm:tw-text-base">{{ $t('common.loadingData') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-center tw-text-sm tw-text-red-600 tw-my-8">
        <p>⚠️ {{ errorMsg }}</p>
        <button @click="loadStats" class="tw-mt-2 tw-underline hover:tw-text-red-800 tw-font-medium">{{ $t('common.retry') }}</button>
      </div>

      <!-- Stats Content -->
      <template v-else-if="stats">
        
        <!-- Stat Cards Grid -->
        <div class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4 sm:tw-gap-5 tw-mb-6 sm:tw-mb-8">
          
          <!-- Card 1: จำนวนการเข้ารับบริการ -->
          <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-border-l-8 tw-border-l-amber-400 tw-p-4 sm:tw-p-6 tw-flex tw-flex-col tw-justify-between">
            <div class="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-2">
              <span class="tw-text-base sm:tw-text-lg tw-font-semibold tw-text-gray-700">{{ $t('index.totalVisits') }}</span>
              <span class="tw-text-xs tw-text-slate-600 tw-bg-amber-100 tw-border tw-border-amber-200 tw-px-2 tw-py-0.5 tw-rounded-full tw-font-mono tw-whitespace-nowrap">{{ stats.month }}</span>
            </div>
            <div>
              <p class="tw-text-2xl sm:tw-text-3xl tw-font-bold tw-text-gray-900">{{ stats.total_visits.toLocaleString() }}</p>
              <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mt-1">{{ $t('index.times') }}</p>
            </div>
          </div>

          <!-- Card 2: จำนวนผู้เข้ารับบริการ (คน) -->
          <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-border-l-8 tw-border-l-purple-400 tw-p-4 sm:tw-p-6 tw-flex tw-flex-col tw-justify-between">
            <div class="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-2">
              <span class="tw-text-base sm:tw-text-lg tw-font-semibold tw-text-gray-700">{{ $t('index.totalVisitors') }}</span>
              <span class="tw-text-xs tw-text-slate-600 tw-bg-purple-100 tw-px-2 tw-py-0.5 tw-rounded-full tw-border tw-border-purple-200 tw-font-mono tw-whitespace-nowrap">{{ $t('index.uniquePersons') }}</span>
            </div>
            <div>
              <p class="tw-text-2xl sm:tw-text-3xl tw-font-bold tw-text-gray-900">{{ stats.total_visitors.toLocaleString() }}</p>
              <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mt-1">{{ $t('index.persons') }}</p>
            </div>
          </div>

          <!-- Card 3: บุคลากรทั้งหมด -->
          <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-border-l-8 tw-border-l-emerald-400 tw-p-4 sm:tw-p-6 tw-flex tw-flex-col tw-justify-between sm:tw-col-span-2 lg:tw-col-span-1">
            <div class="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-2">
              <span class="tw-text-base sm:tw-text-lg tw-font-semibold tw-text-gray-700">{{ $t('index.staffCount') }}</span>
              <span class="tw-text-xs tw-text-slate-600 tw-bg-emerald-100 tw-px-2 tw-py-0.5 tw-rounded-full tw-border tw-border-emerald-200 tw-font-mono tw-whitespace-nowrap">{{ $t('index.staffCountAll') }}</span>
            </div>
            <div>
              <p class="tw-text-2xl sm:tw-text-3xl tw-font-bold tw-text-gray-900">{{ stats.staff_count.toLocaleString() }}</p>
              <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mt-1">{{ $t('index.staffCount') }}</p>
            </div>
          </div>

        </div>

        <!-- หมายเหตุล่างการ์ด -->
        <p class="tw-text-xs tw-text-slate-400 tw-mb-6">{{ $t('index.staffCountFootnote') }}</p>

        <!-- Top Departments Card -->
        <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-p-4 sm:tw-p-6">
          <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-1">{{ $t('index.topDepartments') }}</h2>
          <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mb-5">{{ $t('index.topDepartmentsSub', { month: stats.month }) }}</p>

          <div v-if="stats.top_departments.length === 0" class="tw-text-sm tw-text-slate-400 tw-py-8 tw-text-center">
            {{ $t('index.noData') }}
          </div>

          <div v-else class="tw-space-y-3 sm:tw-space-y-4">
            <div
              v-for="(dept, idx) in stats.top_departments"
              :key="dept.name"
              class="tw-flex tw-items-center tw-gap-3 sm:tw-gap-4 tw-py-2.5 sm:tw-py-3 tw-border-b tw-border-slate-100 last:tw-border-0"
            >
              <!-- Rank Number -->
              <span 
                class="tw-w-7 sm:tw-w-8 tw-h-7 sm:tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-xs sm:tw-text-sm tw-flex-shrink-0"
                :class="rankClass(idx)"
              >
                {{ idx + 1 }}
              </span>

              <!-- Department Bar & Name -->
              <div class="tw-flex-1 tw-min-w-0">
                <p class="tw-font-semibold tw-text-gray-800 tw-text-sm sm:tw-text-base tw-truncate" :title="dept.name">
                  {{ dept.name }}
                </p>
                <div class="tw-h-2 sm:tw-h-2.5 tw-rounded-full tw-bg-slate-100 tw-mt-1.5 tw-overflow-hidden">
                  <div
                    class="tw-h-full tw-rounded-full tw-bg-gradient-to-r tw-from-emerald-400 tw-to-teal-500 tw-transition-all tw-duration-500"
                    :style="{ width: barWidth(dept.count) }"
                  ></div>
                </div>
              </div>

              <!-- Count Badge -->
              <span class="tw-text-xs sm:tw-text-sm tw-font-bold tw-text-gray-700 tw-whitespace-nowrap tw-pl-2">
                {{ $t('index.timesCount', { count: dept.count }) }}
              </span>
            </div>
          </div>
        </div>

      </template>
    </main>
  </div>
</template>

<script setup>
// ============================================================
// Role guard — Dashboard เฉพาะ Admin / Clinic_staff
// ============================================================

const { roles } = useSession()
const isAllowed = computed(() => roles.value.includes('Admin') || roles.value.includes('Clinic_staff'))

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
    errorMsg.value = err?.data?.statusMessage || err?.message || $t('index.fetchError')
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