<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- แถบนำทางด้านข้าง -->
    <Sidebar />

    <!-- พื้นที่เนื้อหาหลัก -->
    <main class="tw-flex-1 tw-min-w-0 tw-p-4 sm:tw-p-6 md:tw-p-8 tw-pt-16 md:tw-pt-8">

      <!-- ========================================================================= -->
      <!-- ======== 1. มุมมองของ รปภ.: ประวัติการตรวจสอบของตัวเองเท่านั้น ======== -->
      <!-- ========================================================================= -->
      <div v-if="isGuard">
        <!-- Header Banner -->
        <div class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 sm:tw-items-center sm:tw-justify-between tw-bg-sky-100 tw-border-l-8 tw-border-l-sky-600 tw-p-4 sm:tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-6 md:tw-mb-8">
          <div>
            <h1 class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-gray-800">{{ $t('history.guardTitle') }}</h1>
            <p class="tw-text-xs sm:tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">{{ $t('history.guardSubtitle') }}</p>
          </div>
          <div>
            <button
              @click="fetchScanHistory"
              :disabled="loading"
              class="tw-w-full sm:tw-w-auto tw-justify-center tw-bg-white hover:tw-bg-sky-50 disabled:tw-bg-gray-100 tw-text-sky-700 tw-border tw-border-sky-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
            >
              <span>{{ loading ? $t('common.loading') : $t('common.refreshHistory') }}</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="tw-text-center tw-py-12 sm:tw-py-16">
          <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-sky-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
          <p class="tw-text-gray-500 tw-text-base sm:tw-text-lg tw-mt-3">{{ $t('common.loadingHistory') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
          <p class="tw-text-sm sm:tw-text-base">{{ $t('common.error') }}: {{ errorMsg }}</p>
          <button @click="fetchScanHistory" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800 tw-font-medium">{{ $t('common.retry') }}</button>
        </div>

        <!-- Empty -->
        <div v-else-if="scanHistory.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
          <p class="tw-text-gray-400 tw-text-base sm:tw-text-lg">{{ $t('history.guardEmpty') }}</p>
          <p class="tw-text-gray-400 tw-text-xs sm:tw-text-sm tw-mt-1">{{ $t('history.guardEmptyHint') }}</p>
        </div>

        <!-- Guard Scan History View -->
        <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
          
          <!-- Mobile Cards (< md) -->
          <div class="tw-block md:tw-hidden tw-divide-y tw-divide-slate-100">
            <div 
              v-for="(item, index) in scanHistory" 
              :key="'guard-m-' + item.id"
              class="tw-p-4 tw-space-y-2.5 hover:tw-bg-slate-50/70 tw-transition-colors"
            >
              <div class="tw-flex tw-items-center tw-justify-between tw-gap-2">
                <div class="tw-flex tw-items-center tw-gap-2">
                  <span class="tw-text-xs tw-font-bold tw-text-slate-400">#{{ index + 1 }}</span>
                  <span class="tw-text-xs tw-bg-slate-100 tw-text-slate-600 tw-px-2 tw-py-0.5 tw-rounded tw-font-medium">
                    {{ item.method === 'qr' ? $t('history.guardMethodQr') : $t('history.guardMethodPhone') }}
                  </span>
                </div>
                <span
                  :class="item.result === 'valid' ? 'tw-bg-green-100 tw-text-green-700' : 'tw-bg-red-100 tw-text-red-700'"
                  class="tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-semibold"
                >
                  {{ item.result === 'valid' ? $t('history.guardResultValid') : $t('history.guardResultInvalid') }}
                </span>
              </div>
              <div>
                <p class="tw-font-semibold tw-text-gray-800 tw-text-sm">{{ item.patient_name || $t('history.unknownName') }}</p>
                <p v-if="item.phone_number" class="tw-text-xs tw-text-slate-500 tw-font-mono tw-mt-0.5">📞 {{ item.phone_number }}</p>
              </div>
              <p class="tw-text-[11px] tw-text-gray-400 tw-pt-1 tw-border-t tw-border-slate-50">
                ⏰ {{ formatDateTime(item.created_at) }}
              </p>
            </div>
          </div>

          <!-- Tablet/Desktop Table (md:) -->
          <div class="tw-hidden md:tw-block tw-overflow-x-auto">
            <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[700px]">
              <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
                <tr>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-12">{{ $t('history.tableNo') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.guardTableSubject') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.guardTableDateTime') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.guardTableMethod') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.guardTableResult') }}</th>
                </tr>
              </thead>
              <tbody class="tw-divide-y tw-divide-slate-100">
                <tr
                  v-for="(item, index) in scanHistory"
                  :key="item.id"
                  class="hover:tw-bg-slate-50 tw-transition-colors"
                >
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-500">{{ index + 1 }}</td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4">
                    <div class="tw-text-gray-800 tw-font-medium">{{ item.patient_name || $t('history.unknownName') }}</div>
                    <div v-if="item.phone_number" class="tw-text-xs tw-text-slate-500 tw-mt-0.5 tw-font-mono">
                      {{ item.phone_number }}
                    </div>
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-800">{{ formatDateTime(item.created_at) }}</td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4">
                    <span class="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-gray-700">
                      {{ item.method === 'qr' ? $t('history.guardMethodQr') : $t('history.guardMethodPhone') }}
                    </span>
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4">
                    <span
                      :class="item.result === 'valid'
                        ? 'tw-bg-green-100 tw-text-green-700'
                        : 'tw-bg-red-100 tw-text-red-700'"
                      class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold"
                    >
                      {{ item.result === 'valid' ? $t('history.guardResultValid') : $t('history.guardResultInvalid') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="tw-px-4 sm:tw-px-6 tw-py-3 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-xs sm:tw-text-sm tw-text-gray-500">
            {{ $t('common.totalItems', { count: scanHistory.length }) }}
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- ======== 2. มุมมองของผู้ใช้ทั่วไป (Patient): นัดหมายทั้งหมดของตนเอง ======== -->
      <!-- ========================================================================= -->
      <template v-else-if="isPatient">
        <!-- Header Banner -->
        <div class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 sm:tw-items-center sm:tw-justify-between tw-bg-cyan-100 tw-border-l-8 tw-border-l-cyan-600 tw-p-4 sm:tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-6 md:tw-mb-8">
          <div>
            <h1 class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-gray-800">{{ $t('history.myTitle') }}</h1>
            <p class="tw-text-xs sm:tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">{{ $t('history.mySubtitle') }}</p>
          </div>
          <div>
            <button
              @click="fetchHistory"
              :disabled="loading"
              class="tw-w-full sm:tw-w-auto tw-justify-center tw-bg-white hover:tw-bg-cyan-50 disabled:tw-bg-gray-100 tw-text-cyan-700 tw-border tw-border-cyan-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
            >
              <span>{{ loading ? $t('common.loading') : $t('common.refreshHistory') }}</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="tw-text-center tw-py-12 sm:tw-py-16">
          <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-cyan-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
          <p class="tw-text-gray-500 tw-text-base sm:tw-text-lg tw-mt-3">{{ $t('common.loadingHistory') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
          <p class="tw-text-sm sm:tw-text-base">{{ $t('common.error') }}: {{ errorMsg }}</p>
          <button @click="fetchHistory" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800 tw-font-medium">{{ $t('common.retry') }}</button>
        </div>

        <!-- Empty -->
        <div v-else-if="upcomingAppointments.length === 0 && pastAppointments.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
          <p class="tw-text-gray-400 tw-text-base sm:tw-text-lg">{{ $t('history.myEmpty') }}</p>
          <p class="tw-text-gray-400 tw-text-xs sm:tw-text-sm tw-mt-1">{{ $t('history.myEmptyHint') }}</p>
        </div>

        <template v-else>
          <!-- ==== ส่วน A: นัดที่จะมาถึง ==== -->
          <section v-if="upcomingAppointments.length > 0" class="tw-mb-6 sm:tw-mb-8">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
                {{ $t('history.upcoming') }}
              </h2>
              <span class="tw-text-xs sm:tw-text-sm tw-text-gray-500">{{ $t('common.totalItems', { count: upcomingAppointments.length }) }}</span>
            </div>
            
            <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
              <!-- Mobile Cards (< md) -->
              <div class="tw-block md:tw-hidden tw-divide-y tw-divide-slate-100">
                <div 
                  v-for="(item, index) in upcomingAppointments" 
                  :key="'up-m-' + item.appointment_id"
                  class="tw-p-4 tw-space-y-2.5 hover:tw-bg-slate-50/70 tw-transition-colors"
                >
                  <div class="tw-flex tw-items-center tw-justify-between tw-gap-2">
                    <div class="tw-flex tw-items-center tw-gap-2">
                      <span class="tw-text-xs tw-font-bold tw-text-slate-400">#{{ index + 1 }}</span>
                      <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2 tw-py-0.5 tw-rounded tw-text-xs">
                        {{ item.license_plate }}
                      </span>
                    </div>
                    <span :class="statusClass(item.display_status || item.status)" class="tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium">
                      {{ statusLabel(item.display_status || item.status) }}
                    </span>
                  </div>
                  <div>
                    <p class="tw-font-semibold tw-text-gray-800 tw-text-sm">{{ item.patient_name }}</p>
                    <p class="tw-text-xs tw-text-teal-700 tw-mt-0.5">🏥 {{ item.department_name || item.dept_id || '-' }}</p>
                  </div>
                  <div class="tw-flex tw-items-center tw-justify-between tw-text-xs tw-bg-cyan-50/60 tw-p-2 tw-rounded-lg tw-text-cyan-900">
                    <span>📅 {{ formatDate(item.appointment_date) }}</span>
                    <span class="tw-font-semibold">🕐 {{ item.time_slot }}</span>
                  </div>
                  <button
                    @click="openDetail(item)"
                    class="tw-w-full tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-py-2 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors tw-mt-1"
                  >
                    {{ $t('common.viewDetails') }}
                  </button>
                </div>
              </div>

              <!-- Tablet/Desktop Table (md:) -->
              <div class="tw-hidden md:tw-block tw-overflow-x-auto">
                <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[840px]">
                  <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
                    <tr>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-12">{{ $t('history.tableNo') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.tablePatient') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[130px]">{{ $t('history.tablePlate') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.tableDept') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[180px]">{{ $t('history.tableDateTime') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[110px]">{{ $t('history.tableStatus') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[120px] tw-text-center">{{ $t('history.tableActions') }}</th>
                    </tr>
                  </thead>
                  <tbody class="tw-divide-y tw-divide-slate-100">
                    <tr
                      v-for="(item, index) in upcomingAppointments"
                      :key="item.appointment_id"
                      class="hover:tw-bg-slate-50 tw-transition-colors"
                    >
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-500">{{ index + 1 }}</td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4">
                        <div class="tw-font-medium tw-text-gray-800 tw-truncate tw-max-w-[190px]" :title="item.patient_name">{{ item.patient_name }}</div>
                        <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5 tw-whitespace-nowrap">{{ item.phone_number || '-' }}</div>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                          {{ item.license_plate }}
                        </span>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-700">
                        <span class="tw-line-clamp-2">{{ item.department_name || item.dept_id || '-' }}</span>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                        <div class="tw-text-xs tw-text-cyan-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <span :class="statusClass(item.display_status || item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                          {{ statusLabel(item.display_status || item.status) }}
                        </span>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-center tw-whitespace-nowrap">
                        <button
                          @click="openDetail(item)"
                          class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                        >
                          {{ $t('common.viewDetails') }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- ==== ส่วน B: ประวัติที่ผ่านมา ==== -->
          <section v-if="pastAppointments.length > 0">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
                {{ $t('history.pastHistory') }}
              </h2>
              <span class="tw-text-xs sm:tw-text-sm tw-text-gray-500">{{ $t('common.totalItems', { count: pastAppointments.length }) }}</span>
            </div>
            
            <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
              <!-- Mobile Cards (< md) -->
              <div class="tw-block md:tw-hidden tw-divide-y tw-divide-slate-100">
                <div 
                  v-for="(item, index) in pastAppointments" 
                  :key="'past-m-' + item.appointment_id"
                  class="tw-p-4 tw-space-y-2.5 hover:tw-bg-slate-50/70 tw-transition-colors"
                >
                  <div class="tw-flex tw-items-center tw-justify-between tw-gap-2">
                    <div class="tw-flex tw-items-center tw-gap-2">
                      <span class="tw-text-xs tw-font-bold tw-text-slate-400">#{{ index + 1 }}</span>
                      <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2 tw-py-0.5 tw-rounded tw-text-xs">
                        {{ item.license_plate }}
                      </span>
                    </div>
                    <span :class="statusClass(item.display_status || item.status)" class="tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium">
                      {{ statusLabel(item.display_status || item.status) }}
                    </span>
                  </div>
                  <div>
                    <p class="tw-font-semibold tw-text-gray-800 tw-text-sm">{{ item.patient_name }}</p>
                    <p class="tw-text-xs tw-text-teal-700 tw-mt-0.5">🏥 {{ item.department_name || item.dept_id || '-' }}</p>
                  </div>
                  <div class="tw-flex tw-items-center tw-justify-between tw-text-xs tw-bg-slate-50 tw-p-2 tw-rounded-lg tw-text-slate-700">
                    <span>📅 {{ formatDate(item.appointment_date) }}</span>
                    <span class="tw-font-medium">🕐 {{ item.time_slot }}</span>
                  </div>
                  <button
                    @click="openDetail(item)"
                    class="tw-w-full tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-py-2 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors tw-mt-1"
                  >
                    {{ $t('common.viewDetails') }}
                  </button>
                </div>
              </div>

              <!-- Tablet/Desktop Table (md:) -->
              <div class="tw-hidden md:tw-block tw-overflow-x-auto">
                <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[840px]">
                  <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
                    <tr>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-12">{{ $t('history.tableNo') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.tablePatient') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[130px]">{{ $t('history.tablePlate') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.tableDept') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[180px]">{{ $t('history.tableDateTime') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[110px]">{{ $t('history.tableStatus') }}</th>
                      <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[120px] tw-text-center">{{ $t('history.tableActions') }}</th>
                    </tr>
                  </thead>
                  <tbody class="tw-divide-y tw-divide-slate-100">
                    <tr
                      v-for="(item, index) in pastAppointments"
                      :key="item.appointment_id"
                      class="hover:tw-bg-slate-50 tw-transition-colors"
                    >
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-500">{{ index + 1 }}</td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4">
                        <div class="tw-font-medium tw-text-gray-800 tw-truncate tw-max-w-[190px]" :title="item.patient_name">{{ item.patient_name }}</div>
                        <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5 tw-whitespace-nowrap">{{ item.phone_number || '-' }}</div>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                          {{ item.license_plate }}
                        </span>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-700">
                        <span class="tw-line-clamp-2">{{ item.department_name || item.dept_id || '-' }}</span>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                        <div class="tw-text-xs tw-text-cyan-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <span :class="statusClass(item.display_status || item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                          {{ statusLabel(item.display_status || item.status) }}
                        </span>
                      </td>
                      <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-center tw-whitespace-nowrap">
                        <button
                          @click="openDetail(item)"
                          class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                        >
                          {{ $t('common.viewDetails') }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </template>
      </template>

      <!-- ========================================================================= -->
      <!-- ======== 3. มุมมองของเจ้าหน้าที่/Admin: ประวัตินัดหมาย + กู้คืน ======== -->
      <!-- ========================================================================= -->
      <template v-else>
        <!-- Header Banner -->
        <div class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 sm:tw-items-center sm:tw-justify-between tw-bg-purple-100 tw-border-l-8 tw-border-l-purple-600 tw-p-4 sm:tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-6 md:tw-mb-8">
          <div>
            <h1 class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-gray-800">{{ $t('history.staffTitle') }}</h1>
            <p class="tw-text-xs sm:tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">{{ $t('history.staffSubtitle') }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="tw-flex tw-flex-col sm:tw-flex-row tw-items-stretch sm:tw-items-center tw-gap-2.5">
            <button 
              v-if="canManage"
              @click="purgeExpired"
              :disabled="purging"
              class="tw-w-full sm:tw-w-auto tw-justify-center tw-bg-white hover:tw-bg-red-50 disabled:tw-bg-gray-100 tw-text-red-600 tw-border tw-border-red-200 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
            >
              <span>{{ purging ? $t('history.purging') : $t('history.purgeExpired') }}</span>
            </button>
            <button 
              @click="fetchHistory" 
              :disabled="loading"
              class="tw-w-full sm:tw-w-auto tw-justify-center tw-bg-white hover:tw-bg-purple-50 disabled:tw-bg-gray-100 tw-text-purple-800 tw-border tw-border-purple-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
            >
              <span>{{ loading ? $t('common.loading') : $t('common.refreshHistory') }}</span>
            </button>
          </div>
        </div>

        <!-- Banner แจ้งเตือนเก็บข้อมูล 30 วัน -->
        <div class="tw-mb-6 tw-bg-indigo-50 tw-border tw-border-indigo-200 tw-p-4 tw-rounded-xl tw-text-indigo-800 tw-text-xs sm:tw-text-sm tw-flex tw-items-start tw-gap-3">
          <p class="tw-text-indigo-700 leading-relaxed">
            {{ $t('history.purgeNoticeBanner', { days: RETENTION_DAYS }) }}
          </p>
        </div>

        <!-- Action bar: กู้คืนแบบกลุ่ม -->
        <div v-if="canRestore && historyAppointments.length > 0" class="tw-mb-6 tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-p-4 tw-shadow-sm">
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-gap-3">
            <div class="tw-text-xs sm:tw-text-sm tw-text-gray-700">
              <span class="tw-font-semibold">{{ $t('history.restoreTitle') }}</span>
              <span class="tw-text-gray-400 tw-ml-1">{{ $t('history.restoreHint') }}</span>
            </div>
            <div class="tw-flex-1 tw-hidden sm:tw-block"></div>
            <div class="tw-flex tw-flex-col sm:tw-flex-row tw-items-stretch sm:tw-items-center tw-gap-2">
              <button
                :disabled="selectedIds.length === 0 || restoringAll"
                @click="askBatchRestore(selectedIds, 'selected')"
                class="tw-w-full sm:tw-w-auto tw-bg-indigo-600 hover:tw-bg-indigo-700 disabled:tw-bg-gray-300 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-xs sm:tw-text-sm tw-font-medium tw-transition-colors"
              >
                {{ $t('history.restoreSelected', { count: selectedIds.length }) }}
              </button>
              <button
                :disabled="historyAppointments.length === 0 || restoringAll"
                @click="askBatchRestore(historyAppointments.map(a => a.appointment_id), 'all')"
                class="tw-w-full sm:tw-w-auto tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-300 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-xs sm:tw-text-sm tw-font-medium tw-transition-colors"
              >
                {{ $t('history.restoreAll', { count: historyAppointments.length }) }}
              </button>
              <button
                v-if="selectedIds.length > 0"
                @click="selectedIds = []"
                class="tw-text-xs sm:tw-text-sm tw-text-gray-500 hover:tw-text-gray-700 tw-underline tw-text-center tw-py-1"
              >
                {{ $t('history.clearSelection') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Toast Message -->
        <div v-if="toastMsg" class="tw-mb-6 tw-bg-green-50 tw-border tw-border-green-200 tw-p-3.5 sm:tw-p-4 tw-rounded-xl tw-text-green-700 tw-text-xs sm:tw-text-sm tw-flex tw-items-center tw-justify-between tw-shadow-sm">
          <div class="tw-flex tw-items-center tw-gap-2">
            <span class="tw-text-base sm:tw-text-lg">✅</span>
            <span>{{ toastMsg }}</span>
          </div>
          <button @click="toastMsg = ''" class="tw-text-green-500 hover:tw-text-green-700 tw-font-bold tw-p-1">✕</button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="tw-text-center tw-py-12 sm:tw-py-16">
          <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-purple-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
          <p class="tw-text-gray-500 tw-text-base sm:tw-text-lg tw-mt-3">{{ $t('common.loadingHistory') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
          <p class="tw-text-sm sm:tw-text-base">{{ $t('common.error') }}: {{ errorMsg }}</p>
          <button @click="fetchHistory" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800 tw-font-medium">{{ $t('common.retry') }}</button>
        </div>

        <!-- Empty -->
        <div v-else-if="historyAppointments.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
          <p class="tw-text-gray-400 tw-text-base sm:tw-text-lg">{{ $t('history.emptyDeleted') }}</p>
          <p class="tw-text-gray-400 tw-text-xs sm:tw-text-sm tw-mt-1">{{ $t('history.emptyDeletedHint') }}</p>
        </div>

        <!-- Staff Data Section -->
        <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
          
          <!-- Mobile Cards (< md) -->
          <div class="tw-block md:tw-hidden tw-divide-y tw-divide-slate-100">
            <div 
              v-for="(item, index) in historyAppointments" 
              :key="'staff-m-' + item.appointment_id"
              :class="[
                'tw-p-4 tw-space-y-3 tw-transition-colors',
                isSelected(item.appointment_id) ? 'tw-bg-indigo-50/70' : 'hover:tw-bg-slate-50/70'
              ]"
            >
              <!-- การเลือก Checkbox + Header -->
              <div class="tw-flex tw-items-center tw-justify-between tw-gap-2">
                <div class="tw-flex tw-items-center tw-gap-2.5">
                  <input
                    v-if="canRestore"
                    type="checkbox"
                    :checked="isSelected(item.appointment_id)"
                    @change="toggleSelect(item)"
                    class="tw-w-4 tw-h-4 tw-accent-indigo-600 tw-cursor-pointer"
                  />
                  <span class="tw-text-xs tw-font-bold tw-text-slate-400">#{{ index + 1 }}</span>
                  <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2 tw-py-0.5 tw-rounded tw-text-xs">
                    {{ item.license_plate }}
                  </span>
                </div>
                <span :class="statusClass(item.display_status || item.status)" class="tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium">
                  {{ statusLabel(item.display_status || item.status) }}
                </span>
              </div>

              <!-- ข้อมูลคนไข้ -->
              <div>
                <p class="tw-font-semibold tw-text-gray-800 tw-text-sm">{{ item.patient_name }}</p>
                <p class="tw-text-xs tw-text-gray-500 tw-mt-0.5">📞 {{ item.phone_number || '-' }}</p>
                <p class="tw-text-xs tw-text-teal-700 tw-mt-1">🏥 {{ item.department_name || item.dept_id || '-' }}</p>
              </div>

              <!-- วันที่และเวลานัดหมาย -->
              <div class="tw-flex tw-items-center tw-justify-between tw-text-xs tw-bg-slate-50 tw-p-2 tw-rounded-lg tw-text-slate-700">
                <span>📅 {{ formatDate(item.appointment_date) }}</span>
                <span class="tw-text-purple-600 tw-font-semibold">🕐 {{ item.time_slot }}</span>
              </div>

              <!-- กำหนดการลบถาวร -->
              <div v-if="item.deleted_at" class="tw-text-[11px] tw-bg-rose-50/70 tw-border tw-border-rose-100 tw-p-2 tw-rounded-lg">
                <div class="tw-text-gray-500">{{ $t('history.deletedAt', { date: formatDateTime(item.deleted_at) }) }}</div>
                <div class="tw-font-semibold tw-mt-0.5" :class="daysUntilPurge(item.deleted_at, item.days_until_purge) !== null && daysUntilPurge(item.deleted_at, item.days_until_purge) <= 7 ? 'tw-text-red-600' : 'tw-text-indigo-600'">
                  {{ purgeNotice(item.deleted_at, item.days_until_purge) }}
                </div>
              </div>

              <!-- ปุ่มจัดการ -->
              <div class="tw-flex tw-gap-2 tw-pt-1">
                <button 
                  @click="openDetail(item)"
                  class="tw-flex-1 tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-py-2 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                >
                  {{ $t('common.viewDetails') }}
                </button>
                <button 
                  v-if="canRestore"
                  @click="askRestoreAppointment(item)"
                  :disabled="restoringId === item.appointment_id"
                  class="tw-flex-1 tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-300 tw-text-white tw-py-2 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors tw-shadow-sm tw-flex tw-items-center tw-justify-center tw-gap-1"
                >
                  <span>{{ restoringId === item.appointment_id ? $t('history.restoring') : $t('history.restoreBtn') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Tablet/Desktop Table (md:) -->
          <div class="tw-hidden md:tw-block tw-overflow-x-auto">
            <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[980px]">
              <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
                <tr>
                  <th v-if="canRestore" class="tw-px-4 lg:tw-px-5 tw-py-4 tw-w-10">
                    <input
                      type="checkbox"
                      :checked="allItemsSelected"
                      @change="toggleSelectAll"
                      class="tw-w-4 tw-h-4 tw-accent-indigo-600 tw-cursor-pointer"
                    />
                  </th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-12">{{ $t('history.tableNo') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.tablePatient') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[130px]">{{ $t('history.tablePlate') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">{{ $t('history.tableDept') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[180px]">{{ $t('history.tableDateTime') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[110px]">{{ $t('history.tableStatus') }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[190px]">{{ $t('history.purgeSoon', { days: RETENTION_DAYS }) }}</th>
                  <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-[180px] tw-text-center">{{ $t('history.tableActions') }}</th>
                </tr>
              </thead>
              <tbody class="tw-divide-y tw-divide-slate-100">
                <tr 
                  v-for="(item, index) in historyAppointments" 
                  :key="item.appointment_id"
                  :class="[
                    'tw-transition-colors',
                    isSelected(item.appointment_id) ? 'tw-bg-indigo-50/70' : 'hover:tw-bg-slate-50'
                  ]"
                >
                  <td v-if="canRestore" class="tw-px-4 lg:tw-px-5 tw-py-4 tw-w-10">
                    <input
                      type="checkbox"
                      :checked="isSelected(item.appointment_id)"
                      @change="toggleSelect(item)"
                      class="tw-w-4 tw-h-4 tw-accent-indigo-600 tw-cursor-pointer"
                    />
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-500">{{ index + 1 }}</td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4">
                    <div class="tw-font-medium tw-text-gray-800 tw-truncate tw-max-w-[200px]" :title="item.patient_name">{{ item.patient_name }}</div>
                    <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5 tw-whitespace-nowrap">{{ item.phone_number || '-' }}</div>
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                    <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                      {{ item.license_plate }}
                    </span>
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-700">
                    <span class="tw-line-clamp-2">{{ item.department_name || item.dept_id || '-' }}</span>
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                    <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                    <div class="tw-text-xs tw-text-purple-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                    <span :class="statusClass(item.display_status || item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                      {{ statusLabel(item.display_status || item.status) }}
                    </span>
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4">
                    <template v-if="item.deleted_at">
                      <div class="tw-text-xs tw-text-gray-500 tw-whitespace-nowrap">{{ $t('history.deletedAt', { date: formatDateTime(item.deleted_at) }) }}</div>
                      <div class="tw-text-xs tw-font-semibold tw-mt-0.5 tw-whitespace-nowrap" :class="daysUntilPurge(item.deleted_at, item.days_until_purge) !== null && daysUntilPurge(item.deleted_at, item.days_until_purge) <= 7 ? 'tw-text-red-600' : 'tw-text-indigo-600'">
                        {{ purgeNotice(item.deleted_at, item.days_until_purge) }}
                      </div>
                    </template>
                    <template v-else>
                      <span class="tw-text-xs tw-text-gray-400 tw-whitespace-nowrap">-</span>
                    </template>
                  </td>
                  <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-center tw-whitespace-nowrap">
                    <div class="tw-flex tw-justify-center tw-gap-2">
                      <button 
                        @click="openDetail(item)"
                        class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                      >
                        {{ $t('common.viewDetails') }}
                      </button>
                      <button 
                        v-if="canRestore"
                        @click="askRestoreAppointment(item)"
                        :disabled="restoringId === item.appointment_id"
                        class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-300 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors tw-shadow-sm tw-flex tw-items-center tw-gap-1"
                      >
                        <span>{{ restoringId === item.appointment_id ? $t('history.restoring') : $t('history.restoreBtn') }}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="tw-px-4 sm:tw-px-6 tw-py-3.5 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-xs sm:tw-text-sm tw-text-gray-500">
            {{ $t('history.totalHistory', { count: historyAppointments.length }) }}
          </div>
        </div>
      </template>

    </main>

    <!-- ======= 1. Detail Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-3 sm:tw-p-4"
        >
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeModal"></div>

          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-overflow-hidden tw-transform tw-transition-all tw-max-h-[92vh] tw-flex tw-flex-col">
            <!-- Modal Header -->
            <div class="tw-bg-gradient-to-r tw-from-purple-500 tw-to-indigo-600 tw-px-5 sm:tw-px-6 tw-py-3.5 sm:tw-py-4">
              <div class="tw-flex tw-items-center tw-justify-between">
                <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-white">{{ $t('history.detailTitle') }}</h2>
                <button 
                  @click="closeModal"
                  class="tw-text-white/80 hover:tw-text-white tw-transition-colors tw-text-2xl tw-leading-none tw-font-light tw-p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Modal Body -->
            <div v-if="selectedAppointment" class="tw-px-4 sm:tw-px-6 tw-py-4 sm:tw-py-5 tw-space-y-4 tw-overflow-y-auto">
              <!-- QR Code -->
              <div class="tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-p-4 tw-flex tw-flex-col tw-items-center tw-gap-2">
                <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">QR TOKEN</p>
                <QrCodeDisplay :value="selectedAppointment.qr_token" :size="144" />
              </div>

              <div class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3 sm:tw-gap-4">
                <!-- Appointment ID -->
                <div class="tw-flex tw-items-start tw-gap-3">
                  <div class="tw-w-8 tw-h-8 tw-bg-slate-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                    <span class="tw-text-slate-500 tw-text-sm">#</span>
                  </div>
                  <div class="tw-min-w-0">
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.appointmentId') }}</p>
                    <p class="tw-text-gray-800 tw-font-semibold tw-text-sm tw-truncate">{{ selectedAppointment.appointment_id }}</p>
                  </div>
                </div>

                <!-- ชื่อผู้ป่วย -->
                <div class="tw-flex tw-items-start tw-gap-3">
                  <div class="tw-w-8 tw-h-8 tw-bg-blue-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                    <span class="tw-text-blue-500 tw-text-sm">👤</span>
                  </div>
                  <div class="tw-min-w-0">
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.patientName') }}</p>
                    <p class="tw-text-gray-800 tw-font-semibold tw-text-sm tw-truncate">{{ selectedAppointment.patient_name }}</p>
                  </div>
                </div>

                <!-- เบอร์โทรศัพท์ -->
                <div class="tw-flex tw-items-start tw-gap-3">
                  <div class="tw-w-8 tw-h-8 tw-bg-emerald-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                    <span class="tw-text-emerald-500 tw-text-sm">📞</span>
                  </div>
                  <div>
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.phoneNumber') }}</p>
                    <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ selectedAppointment.phone_number || '-' }}</p>
                  </div>
                </div>

                <!-- ทะเบียนรถยนต์ -->
                <div class="tw-flex tw-items-start tw-gap-3">
                  <div class="tw-w-8 tw-h-8 tw-bg-cyan-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                    <span class="tw-text-cyan-500 tw-text-sm">🚗</span>
                  </div>
                  <div>
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.licensePlate') }}</p>
                    <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ selectedAppointment.license_plate }}</p>
                  </div>
                </div>

                <!-- แผนกตรวจ -->
                <div class="tw-flex tw-items-start tw-gap-3">
                  <div class="tw-w-8 tw-h-8 tw-bg-teal-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                    <span class="tw-text-teal-500 tw-text-sm">🏥</span>
                  </div>
                  <div class="tw-min-w-0">
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.department') }}</p>
                    <p class="tw-text-gray-800 tw-font-semibold tw-text-sm tw-truncate">{{ selectedAppointment.department_name || selectedAppointment.dept_id }}</p>
                  </div>
                </div>

                <!-- วันนัดหมาย -->
                <div class="tw-flex tw-items-start tw-gap-3">
                  <div class="tw-w-8 tw-h-8 tw-bg-green-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                    <span class="tw-text-green-500 tw-text-sm">📅</span>
                  </div>
                  <div>
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.appointmentDate') }}</p>
                    <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ formatDate(selectedAppointment.appointment_date) }}</p>
                  </div>
                </div>

                <!-- ช่วงเวลา -->
                <div class="tw-flex tw-items-start tw-gap-3">
                  <div class="tw-w-8 tw-h-8 tw-bg-purple-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                    <span class="tw-text-purple-500 tw-text-sm">🕐</span>
                  </div>
                  <div>
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.timeSlot') }}</p>
                    <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ selectedAppointment.time_slot }}</p>
                  </div>
                </div>

                <!-- สถานะ -->
                <div class="tw-flex tw-items-start tw-gap-3">
                  <div class="tw-w-8 tw-h-8 tw-bg-amber-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                    <span class="tw-text-amber-500 tw-text-sm">📋</span>
                  </div>
                  <div>
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.status') }}</p>
                    <span :class="statusClass(selectedAppointment.status)" class="tw-inline-block tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-mt-0.5">
                      {{ statusLabel(selectedAppointment.status) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- กำหนดการลบถาวร -->
              <div v-if="selectedAppointment.deleted_at" class="tw-flex tw-items-start tw-gap-3 tw-pt-2 tw-border-t tw-border-slate-100">
                <div class="tw-w-8 tw-h-8 tw-bg-rose-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-rose-500 tw-text-sm">🗑️</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('history.permanentDelete') }}</p>
                  <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ purgeNotice(selectedAppointment.deleted_at, selectedAppointment.days_until_purge) }}</p>
                  <p class="tw-text-xs tw-text-gray-500 tw-mt-0.5">{{ $t('history.deletedOn', { date: formatDateTime(selectedAppointment.deleted_at) }) }}</p>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="tw-px-5 sm:tw-px-6 tw-py-3.5 sm:tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end">
              <button 
                @click="closeModal"
                class="tw-w-full sm:tw-w-auto tw-bg-slate-200 hover:tw-bg-slate-300 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                {{ $t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ======= 2. Restore Confirm Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showRestoreModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
        >
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeRestoreModal"></div>

          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transform tw-transition-all tw-max-h-[90vh] tw-overflow-y-auto">
            <div class="tw-p-5 sm:tw-p-6 tw-text-center">
              <h3 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-2">{{ $t('history.restoreConfirmTitle') }}</h3>
              <p class="tw-text-xs sm:tw-text-sm tw-text-gray-600 tw-mb-4">
                {{ $t('history.restoreConfirmText', {
                  name: itemToRestore?.patient_name,
                  id: itemToRestore?.appointment_id,
                }) }}
              </p>
              <p class="tw-text-xs tw-text-purple-700 tw-bg-purple-50 tw-p-3 tw-rounded-xl tw-border tw-border-purple-200">
                {{ $t('history.restoreConfirmNote') }}
              </p>
            </div>

            <div class="tw-px-5 sm:tw-px-6 tw-py-3.5 sm:tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-flex-col-reverse sm:tw-flex-row tw-justify-end tw-gap-2 sm:tw-gap-3">
              <button 
                @click="closeRestoreModal"
                :disabled="restoringId !== null"
                class="tw-w-full sm:tw-w-auto tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                {{ $t('common.cancel') }}
              </button>
              <button 
                @click="confirmRestoreAppointment"
                :disabled="restoringId !== null"
                class="tw-w-full sm:tw-w-auto tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm"
              >
                {{ restoringId !== null ? $t('history.restoring') : $t('history.confirmRestore') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ======= 3. Batch Restore Confirm Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showBatchRestoreModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
        >
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeBatchRestoreModal"></div>

          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transform tw-transition-all tw-max-h-[90vh] tw-overflow-y-auto">
            <div class="tw-p-5 sm:tw-p-6 tw-text-center">
              <h3 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-2">{{ batchRestoreMode === 'all' ? $t('history.batchRestoreTitleAll') : $t('history.batchRestoreTitleSelected') }}</h3>
              <p class="tw-text-xs sm:tw-text-sm tw-text-gray-600 tw-mb-4">
                {{ $t('history.batchRestoreText', { count: batchRestoreIds.length }) }}
              </p>
              <p class="tw-text-xs tw-text-purple-700 tw-bg-purple-50 tw-p-3 tw-rounded-xl tw-border tw-border-purple-200">
                {{ $t('history.batchRestoreNote') }}
              </p>
            </div>

            <div class="tw-px-5 sm:tw-px-6 tw-py-3.5 sm:tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-flex-col-reverse sm:tw-flex-row tw-justify-end tw-gap-2 sm:tw-gap-3">
              <button 
                @click="closeBatchRestoreModal"
                :disabled="restoringAll"
                class="tw-w-full sm:tw-w-auto tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                {{ $t('common.cancel') }}
              </button>
              <button 
                @click="confirmBatchRestore"
                :disabled="restoringAll"
                class="tw-w-full sm:tw-w-auto tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm"
              >
                {{ restoringAll ? $t('history.restoring') : $t('history.confirmRestore') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
// ============================================================
// Composables
// ============================================================

import { RETENTION_DAYS } from '~/constants/appointments'

const { statusClass, statusLabel, formatDate, formatDateTime, daysUntilPurge, purgeNotice } = useAppointment()

const { session, roles, canRestore, canManage, isGuard } = useSession()
const isPatient = computed(() => roles.value.length === 1 && roles.value[0] === 'Patient')

// ============================================================
// State
// ============================================================

const appointments = ref([])
const loading = ref(false)
const errorMsg = ref('')
const restoringId = ref(null)
const purging = ref(false)
const toastMsg = ref('')

const scanHistory = ref([])
const selectedIds = ref([])
const restoringAll = ref(false)

const showBatchRestoreModal = ref(false)
const batchRestoreIds = ref([])
const batchRestoreMode = ref('selected')

const historyAppointments = computed(() => {
  return appointments.value.filter(item => item.status === 'cancelled' || item.status === 'completed')
})

const serverToday = computed(() => session.value?.server_today || '')
const patientAppointments = computed(() => {
  return [...appointments.value].sort((a, b) =>
    String(b.appointment_date).localeCompare(String(a.appointment_date))
  )
})

const upcomingAppointments = computed(() => {
  const today = serverToday.value
  if (!today) return patientAppointments.value
  return patientAppointments.value.filter(a => String(a.appointment_date) >= today)
})

const pastAppointments = computed(() => {
  const today = serverToday.value
  if (!today) return []
  return patientAppointments.value.filter(a => String(a.appointment_date) < today)
})

const allItemsSelected = computed(() => {
  return historyAppointments.value.length > 0 &&
    historyAppointments.value.every(a => isSelected(a.appointment_id))
})

// ============================================================
// Checkbox Selection
// ============================================================

const isSelected = (id) => selectedIds.value.includes(id)

const toggleSelect = (item) => {
  const idx = selectedIds.value.indexOf(item.appointment_id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(item.appointment_id)
}

const toggleSelectAll = () => {
  selectedIds.value = allItemsSelected.value
    ? []
    : historyAppointments.value.map(a => a.appointment_id)
}

// Detail & Restore Modal States
const showModal = ref(false)
const selectedAppointment = ref(null)

const showRestoreModal = ref(false)
const itemToRestore = ref(null)

// ============================================================
// API Fetching
// ============================================================

const fetchHistory = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('/api/appointments', { method: 'GET' })
    appointments.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || $t('history.fetchError')
  } finally {
    loading.value = false
  }
}

const fetchScanHistory = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('/api/scan/history', { method: 'GET' })
    scanHistory.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || $t('history.fetchError')
  } finally {
    loading.value = false
  }
}

// ============================================================
// Purge & Batch Actions
// ============================================================

const purgeExpired = async () => {
  purging.value = true
  try {
    const res = await $fetch('/api/cleanup/purge', { method: 'POST' })
    toastMsg.value = res?.message || $t('history.purgeSuccess')
    await fetchHistory()
    setTimeout(() => {
      toastMsg.value = ''
    }, 4000)
  } catch (error) {
    alert($t('history.purgeError', { detail: error?.data?.statusMessage || error?.message || $t('common.unknown') }))
    console.error('Purge error:', error)
  } finally {
    purging.value = false
  }
}

const showToast = (msg) => {
  toastMsg.value = msg
  setTimeout(() => {
    toastMsg.value = ''
  }, 4000)
}

const askBatchRestore = (ids, mode = 'selected') => {
  if (!ids || ids.length === 0) return
  batchRestoreIds.value = [...ids]
  batchRestoreMode.value = mode
  showBatchRestoreModal.value = true
}

const closeBatchRestoreModal = () => {
  showBatchRestoreModal.value = false
  batchRestoreIds.value = []
}

const confirmBatchRestore = async () => {
  if (batchRestoreIds.value.length === 0) return

  restoringAll.value = true
  try {
    const res = await $fetch('/api/appointments/restore-batch', {
      method: 'POST',
      body: { ids: batchRestoreIds.value },
    })
    const count = res?.count || 0

    const restoredSet = new Set(batchRestoreIds.value)
    appointments.value = appointments.value.map(i =>
      restoredSet.has(i.appointment_id) ? { ...i, status: 'backup', deleted_at: null } : i
    )

    selectedIds.value = []
    closeBatchRestoreModal()
    showToast($t('history.batchRestoreSuccess', { count }))
  } catch (error) {
    alert($t('history.restoreError', { detail: error?.data?.statusMessage || error?.message || $t('common.unknown') }))
    console.error('Batch restore error:', error)
  } finally {
    restoringAll.value = false
  }
}

// ============================================================
// Modal Actions
// ============================================================

const askRestoreAppointment = (item) => {
  itemToRestore.value = item
  showRestoreModal.value = true
}

const closeRestoreModal = () => {
  showRestoreModal.value = false
  itemToRestore.value = null
}

const confirmRestoreAppointment = async () => {
  if (!itemToRestore.value) return

  const appointmentId = itemToRestore.value.appointment_id
  const patientName = itemToRestore.value.patient_name
  restoringId.value = appointmentId

  try {
    await $fetch(`/api/appointments/${appointmentId}/restore`, { method: 'POST' })

    const item = appointments.value.find(i => i.appointment_id === appointmentId)
    if (item) {
      item.status = 'backup'
    } else {
      appointments.value = appointments.value.filter(i => i.appointment_id !== appointmentId)
    }

    toastMsg.value = $t('history.restoreSuccess', { name: patientName })
    closeRestoreModal()

    setTimeout(() => {
      toastMsg.value = ''
    }, 4000)
  } catch (error) {
    // ✅ แก้เป็นแบบนี้:
  alert($t('history.restoreError', { detail: error?.data?.statusMessage || error?.message || $t('common.unknown') }))
    console.error('Restore error:', error)
  } finally {
    restoringId.value = null
  }
}

const openDetail = (item) => {
  selectedAppointment.value = { ...item }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedAppointment.value = null
}

// ============================================================
// Lifecycle
// ============================================================

const { locale } = useI18n()
watch(locale, () => {
  if (!session?.value || !session.value.is_logged_in) return
  if (isGuard.value) {
    fetchScanHistory()
  } else {
    fetchHistory()
  }
})

onMounted(() => {
  if (isGuard.value) {
    fetchScanHistory()
    return
  }
  fetchHistory()
  if (canManage.value) {
    purgeExpired()
  }
})
</script>