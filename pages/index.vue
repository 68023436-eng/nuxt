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

      <!-- Range Selector (1 วัน / 1 เดือน) & Month Selector & Action -->
      <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-center tw-gap-2.5 sm:tw-gap-3 tw-mb-6 tw-bg-white tw-p-3.5 sm:tw-p-4 tw-rounded-xl tw-border tw-border-slate-200/80 tw-shadow-sm">
        <!-- Toggle ช่วงเวลา: 1 วัน / 1 เดือน -->
        <div class="tw-inline-flex tw-self-start tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-100 tw-p-0.5">
          <button
            v-for="opt in rangeOptions"
            :key="opt.value"
            @click="setRange(opt.value)"
            :disabled="loading"
            class="tw-px-4 tw-py-2 tw-text-xs sm:tw-text-sm tw-font-semibold tw-rounded-[10px] tw-transition-colors disabled:tw-opacity-60"
            :class="range === opt.value ? 'tw-bg-emerald-600 tw-text-white tw-shadow-sm' : 'tw-text-slate-600 hover:tw-text-gray-800'"
          >
            {{ $t(opt.label) }}
          </button>
        </div>

        <!-- Month input: แสดงเฉพาะโหมดรายเดือน -->
        <template v-if="range === 'month'">
          <label class="tw-text-xs sm:tw-text-sm tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap" for="dash-month">
            {{ $t('index.selectMonth') }}
          </label>
          <input
            id="dash-month"
            v-model="month"
            type="month"
            :disabled="loading"
            @change="loadStats"
            placeholder="yyyy-mm"
            class="tw-w-full sm:tw-w-auto tw-px-3 tw-py-2 tw-text-sm tw-rounded-xl tw-border tw-border-slate-300 tw-bg-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400 disabled:tw-bg-slate-100"
          />
        </template>

        <button
          @click="loadStats"
          :disabled="loading"
          class="tw-w-full sm:tw-w-auto tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-text-sm tw-font-semibold tw-py-2 tw-px-5 tw-rounded-xl tw-shadow-sm tw-transition-colors tw-flex tw-items-center tw-justify-center"
        >
          {{ loading ? $t('common.loading') :$t('index.viewData') }}
        </button>
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
              <span class="tw-text-xs tw-text-slate-600 tw-bg-amber-100 tw-border tw-border-amber-200 tw-px-2 tw-py-0.5 tw-rounded-full tw-font-mono tw-whitespace-nowrap">{{ periodLabel }}</span>
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

        <!-- Scan Summary Card: QR Code & Phone Check -->
        <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-p-4 sm:tw-p-6 tw-mb-6 sm:tw-mb-8">
          <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-1">{{ $t('index.scanSummary') }}</h2>
          <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mb-5">{{ stats.range === 'day' ? $t('index.scanSummarySubDay') : $t('index.scanSummarySub', { month: stats.month }) }}</p>

          <div class="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-3 sm:tw-gap-4">
            <!-- Total checks -->
            <div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-3 sm:tw-p-4 tw-flex tw-flex-col tw-gap-1">
              <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-slate-500">🔎 {{ $t('index.scanTotal') }}</span>
              <span class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-gray-900">{{ scanSummary.total.toLocaleString() }}</span>
              <span class="tw-text-xs tw-text-slate-400">{{ $t('index.times') }}</span>
            </div>

            <!-- QR scans -->
            <div class="tw-rounded-xl tw-border tw-border-sky-200 tw-bg-sky-50 tw-p-3 sm:tw-p-4 tw-flex tw-flex-col tw-gap-1">
              <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-sky-700">📷 {{ $t('index.scanQr') }}</span>
              <span class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-sky-900">{{ scanSummary.qr.toLocaleString() }}</span>
              <span class="tw-text-xs tw-text-sky-500">{{ $t('index.times') }}</span>
            </div>

            <!-- Phone checks -->
            <div class="tw-rounded-xl tw-border tw-border-indigo-200 tw-bg-indigo-50 tw-p-3 sm:tw-p-4 tw-flex tw-flex-col tw-gap-1">
              <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-indigo-700">📞 {{ $t('index.scanPhone') }}</span>
              <span class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-indigo-900">{{ scanSummary.phone.toLocaleString() }}</span>
              <span class="tw-text-xs tw-text-indigo-500">{{ $t('index.times') }}</span>
            </div>

            <!-- Valid checks -->
            <div class="tw-rounded-xl tw-border tw-border-emerald-200 tw-bg-emerald-50 tw-p-3 sm:tw-p-4 tw-flex tw-flex-col tw-gap-1">
              <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-emerald-700">✅ {{ $t('index.scanValid') }}</span>
              <span class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-emerald-900">{{ scanSummary.valid.toLocaleString() }}</span>
              <span class="tw-text-xs tw-text-emerald-500">{{ $t('index.times') }}</span>
            </div>
          </div>

          <!-- Invalid note -->
          <p v-if="scanSummary.invalid > 0" class="tw-text-xs tw-text-slate-400 tw-mt-3">
            {{ $t('index.scanInvalidNote', { count: scanSummary.invalid }) }}
          </p>
        </div>

        <!-- Overview Card: เปรียบเทียบระหว่างนัดหมาย กับ การตรวจสิทธิ์จริง -->
        <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-p-4 sm:tw-p-6 tw-mb-6 sm:tw-mb-8">
          <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-1">📊 {{ $t('index.overviewTitle') }}</h2>
          <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mb-5">{{ stats.range === 'day' ? $t('index.overviewSubDay') : $t('index.overviewSub', { month: stats.month }) }}</p>

          <!-- Stat tiles -->
          <div class="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-3 sm:tw-gap-4 tw-mb-6">
            <!-- นัดหมายทั้งหมด -->
            <div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-3 sm:tw-p-4 tw-flex tw-flex-col tw-gap-1">
              <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-slate-500">🗓️ {{ $t('index.overviewAppointments') }}</span>
              <span class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-gray-900">{{ overview.appointments.toLocaleString() }}</span>
              <span class="tw-text-xs tw-text-slate-400">{{ $t('index.times') }}</span>
            </div>

            <!-- การตรวจสิทธิ์ทั้งหมด (QR + เบอร์) -->
            <div class="tw-rounded-xl tw-border tw-border-sky-200 tw-bg-sky-50 tw-p-3 sm:tw-p-4 tw-flex tw-flex-col tw-gap-1">
              <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-sky-700">🔎 {{ $t('index.overviewScans') }}</span>
              <span class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-sky-900">{{ overview.scans.toLocaleString() }}</span>
              <span class="tw-text-xs tw-text-sky-500">{{ $t('index.overviewQr') }} {{ overview.qr.toLocaleString() }} · {{ $t('index.overviewPhone') }} {{ overview.phone.toLocaleString() }}</span>
            </div>

            <!-- พบสิทธิ์ -->
            <div class="tw-rounded-xl tw-border tw-border-emerald-200 tw-bg-emerald-50 tw-p-3 sm:tw-p-4 tw-flex tw-flex-col tw-gap-1">
              <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-emerald-700">✅ {{ $t('index.overviewValid') }}</span>
              <span class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-emerald-900">{{ overview.valid.toLocaleString() }}</span>
              <span class="tw-text-xs tw-text-emerald-500">{{ $t('index.times') }}</span>
            </div>

            <!-- ไม่พบสิทธิ์ -->
            <div class="tw-rounded-xl tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 sm:tw-p-4 tw-flex tw-flex-col tw-gap-1">
              <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-red-600">✕ {{ $t('index.overviewInvalid') }}</span>
              <span class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-red-800">{{ overview.invalid.toLocaleString() }}</span>
              <span class="tw-text-xs tw-text-red-400">{{ $t('index.times') }}</span>
            </div>
          </div>

          <!-- Comparison bars: สัดส่วนเทียบกับนัดหมายทั้งหมด -->
          <div class="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4 sm:tw-p-5">
            <p class="tw-text-xs sm:tw-text-sm tw-font-semibold tw-text-gray-600 tw-mb-4">{{ $t('index.overviewCompare') }}</p>
            <div class="tw-space-y-3.5 sm:tw-space-y-4">
              <div>
                <div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
                  <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-slate-600">{{ $t('index.overviewScans') }}</span>
                  <span class="tw-text-xs sm:tw-text-sm tw-font-bold tw-text-slate-700">{{ overview.scans.toLocaleString() }} / {{ overview.appointments.toLocaleString() }}</span>
                </div>
                <div class="tw-h-2.5 tw-rounded-full tw-bg-slate-200 tw-overflow-hidden">
                  <div class="tw-h-full tw-rounded-full tw-bg-sky-400 tw-transition-all tw-duration-500" :style="{ width: overviewPct(overview.scans) }"></div>
                </div>
              </div>

              <div>
                <div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
                  <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-slate-600">{{ $t('index.overviewQr') }}</span>
                  <span class="tw-text-xs sm:tw-text-sm tw-font-bold tw-text-slate-700">{{ overview.qr.toLocaleString() }} / {{ overview.appointments.toLocaleString() }}</span>
                </div>
                <div class="tw-h-2.5 tw-rounded-full tw-bg-slate-200 tw-overflow-hidden">
                  <div class="tw-h-full tw-rounded-full tw-bg-indigo-400 tw-transition-all tw-duration-500" :style="{ width: overviewPct(overview.qr) }"></div>
                </div>
              </div>

              <div>
                <div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
                  <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-slate-600">{{ $t('index.overviewPhone') }}</span>
                  <span class="tw-text-xs sm:tw-text-sm tw-font-bold tw-text-slate-700">{{ overview.phone.toLocaleString() }} / {{ overview.appointments.toLocaleString() }}</span>
                </div>
                <div class="tw-h-2.5 tw-rounded-full tw-bg-slate-200 tw-overflow-hidden">
                  <div class="tw-h-full tw-rounded-full tw-bg-violet-400 tw-transition-all tw-duration-500" :style="{ width: overviewPct(overview.phone) }"></div>
                </div>
              </div>

              <div>
                <div class="tw-flex tw-items-center tw-justify-between tw-mb-1">
                  <span class="tw-text-xs sm:tw-text-sm tw-font-medium tw-text-slate-600">{{ $t('index.overviewValid') }}</span>
                  <span class="tw-text-xs sm:tw-text-sm tw-font-bold tw-text-emerald-700">{{ overview.valid.toLocaleString() }} / {{ overview.appointments.toLocaleString() }}</span>
                </div>
                <div class="tw-h-2.5 tw-rounded-full tw-bg-slate-200 tw-overflow-hidden">
                  <div class="tw-h-full tw-rounded-full tw-bg-emerald-400 tw-transition-all tw-duration-500" :style="{ width: overviewPct(overview.valid) }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary sentence -->
          <p class="tw-text-xs sm:tw-text-sm tw-text-slate-600 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-xl tw-p-3 sm:tw-p-4 tw-mt-5">
            {{ $t('index.overviewSummary', { appointments: overview.appointments, scans: overview.scans, qr: overview.qr, phone: overview.phone, valid: overview.valid, invalid: overview.invalid }) }}
          </p>
        </div>

        <!-- Top Departments Card -->
        <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-200 tw-p-4 sm:tw-p-6">
          <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-1">{{ $t('index.topDepartments') }}</h2>
          <p class="tw-text-xs sm:tw-text-sm tw-text-slate-500 tw-mb-5">{{ stats.range === 'day' ? $t('index.topDepartmentsSubDay') : $t('index.topDepartmentsSub', { month: stats.month }) }}</p>

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
// ช่วงเวลาที่กรอง: 'day' = 1 วัน (วันนี้), 'month' = 1 เดือน (เดือนที่เลือก)
const range = ref('month')
const rangeOptions = [
  { value: 'day', label: 'index.rangeDay' },
  { value: 'month', label: 'index.rangeMonth' },
]
const stats = ref(null)
const loading = ref(false)
const errorMsg = ref('')

// ============================================================
// Actions
// ============================================================

const setRange = (value) => {
  if (range.value === value || loading.value) return
  range.value = value
  loadStats()
}

const loadStats = async () => {
  if (loading.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch('/api/dashboard/stats', {
      query: { month: month.value, range: range.value },
    })
    stats.value = res
  } catch (err) {
    stats.value = null
    errorMsg.value = err?.data?.statusMessage || err?.message || $t('index.fetchError')
  } finally {
    loading.value = false
  }
}

// ป้ายช่วงเวลาที่แสดงบนการ์ด (วันนี้ / เดือนที่เลือก)
const periodLabel = computed(() =>
  stats.value?.range === 'day' ? $t('index.todayLabel') : (stats.value?.month || ''),
)

// สรุปการเข้าใช้บริการจากการสแกน QR / เช็คเบอร์โทร (กันค่า undefined จากข้อมูลเก่า)
const scanSummary = computed(() => ({
  total: stats.value?.scan_summary?.total ?? 0,
  qr: stats.value?.scan_summary?.qr ?? 0,
  phone: stats.value?.scan_summary?.phone ?? 0,
  valid: stats.value?.scan_summary?.valid ?? 0,
  invalid: stats.value?.scan_summary?.invalid ?? 0,
}))

// ภาพรวมเปรียบเทียบระหว่างนัดหมาย (appointments) กับ การตรวจสิทธิ์จริง (scan_history)
const overview = computed(() => ({
  appointments: stats.value?.overview?.appointments ?? stats.value?.total_visits ?? 0,
  scans: stats.value?.overview?.scans ?? scanSummary.value.total,
  qr: stats.value?.overview?.qr ?? scanSummary.value.qr,
  phone: stats.value?.overview?.phone ?? scanSummary.value.phone,
  valid: stats.value?.overview?.valid ?? scanSummary.value.valid,
  invalid: stats.value?.overview?.invalid ?? scanSummary.value.invalid,
}))

// ความกว้างแถบเทียบสัดส่วนกับจำนวนนัดหมายทั้งหมด (ไม่เกิน 100%)
const overviewPct = (count) => {
  const total = overview.value.appointments
  if (!total) return '0%'
  const pct = Math.round((count / total) * 100)
  return `${Math.min(Math.max(pct, count > 0 ? 4 : 0), 100)}%`
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