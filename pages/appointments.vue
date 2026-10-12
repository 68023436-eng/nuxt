<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="tw-flex-1 tw-min-w-0 tw-p-4 sm:tw-p-6 md:tw-p-8 tw-pt-16 md:tw-pt-8">
      
      <!-- Header Banner พร้อมปุ่มรีเฟรช -->
      <div class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 sm:tw-items-center sm:tw-justify-between tw-bg-amber-100 tw-border-l-8 tw-border-l-amber-500 tw-p-4 sm:tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-6 md:tw-mb-8">
        <div>
          <h1 class="tw-text-xl sm:tw-text-2xl tw-font-bold tw-text-black">{{ $t('appointments.title') }}</h1>
          <p class="tw-text-xs sm:tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">{{ $t('appointments.subtitle') }}</p>
        </div>

        <div class="tw-flex tw-items-center">
          <button 
            @click="fetchAppointments" 
            :disabled="loading"
            class="tw-w-full sm:tw-w-auto tw-justify-center tw-bg-white hover:tw-bg-amber-50 disabled:tw-bg-gray-100 tw-text-amber-800 tw-border tw-border-amber-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
          >
            <span>{{ loading ? $t('common.loading') :$t('common.refresh') }}</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="tw-text-center tw-py-12 sm:tw-py-16">
        <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-amber-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
        <p class="tw-text-gray-500 tw-text-base sm:tw-text-lg tw-mt-3">{{ $t('common.loadingData') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 sm:tw-p-5 tw-rounded-xl tw-text-red-600">
        <p class="tw-text-sm sm:tw-text-base">{{ $t('common.error') }}: {{ errorMsg }}</p>
        <button @click="fetchAppointments" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800 tw-font-medium">{{ $t('common.retry') }}</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="activeAppointments.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
        <p class="tw-text-gray-400 tw-text-base sm:tw-text-lg">{{ $t('appointments.empty') }}</p>
        <p class="tw-text-gray-300 tw-text-xs sm:tw-text-sm tw-mt-1">{{ $t('appointments.emptyHint') }}</p>
      </div>

      <!-- Data Section -->
      <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
        
        <!-- Mobile Card View (< md) -->
        <div class="tw-block md:tw-hidden tw-divide-y tw-divide-slate-100">
          <div 
            v-for="(item, index) in activeAppointments" 
            :key="'mobile-' + item.appointment_id"
            class="tw-p-4 tw-space-y-3 hover:tw-bg-slate-50/60 tw-transition-colors"
          >
            <div class="tw-flex tw-items-center tw-justify-between tw-gap-2">
              <div class="tw-flex tw-items-center tw-gap-2">
                <span class="tw-text-xs tw-font-bold tw-text-slate-400">#{{ index + 1 }}</span>
                <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2 tw-py-0.5 tw-rounded tw-text-xs">
                  {{ item.license_plate }}
                </span>
              </div>
              <span :class="statusClass(item.status)" class="tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium">
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <div class="tw-grid tw-grid-cols-1 tw-gap-1">
              <p class="tw-font-semibold tw-text-gray-800 tw-text-base">{{ item.patient_name }}</p>
              <p class="tw-text-xs tw-text-gray-500 tw-flex tw-items-center tw-gap-1">
                <span>📞</span> {{ item.phone_number || '-' }}
              </p>
              <p class="tw-text-xs tw-text-teal-700 tw-mt-1">
                🏥 {{ item.department_name || item.dept_id || '-' }}
              </p>
            </div>

            <div class="tw-flex tw-items-center tw-justify-between tw-text-xs tw-bg-slate-50 tw-p-2.5 tw-rounded-lg tw-border tw-border-slate-100">
              <span class="tw-text-gray-600">📅 {{ formatDate(item.appointment_date) }}</span>
              <span class="tw-text-amber-600 tw-font-semibold">🕐 {{ item.time_slot }}</span>
            </div>

            <div class="tw-flex tw-gap-2 tw-pt-1">
              <button 
                @click="openDetail(item)"
                class="tw-flex-1 tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-py-2 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
              >
                {{ $t('common.viewDetails') }}
              </button>
              <button 
                v-if="canCancel"
                @click="askDeleteAppointment(item)"
                :disabled="deletingId === item.appointment_id"
                class="tw-bg-red-500 hover:tw-bg-red-600 disabled:tw-bg-gray-300 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
              >
                {{ deletingId === item.appointment_id ? $t('common.deleting') :$t('common.delete') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tablet & Desktop Table (md:) -->
        <div class="tw-hidden md:tw-block tw-overflow-x-auto">
          <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[840px]">
            <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
              <tr>
                <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-12">{{ $t('appointments.tableNo') }}</th>
                <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap">{{ $t('appointments.tablePatient') }}</th>
                <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[130px]">{{ $t('appointments.tablePlate') }}</th>
                <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap">{{ $t('appointments.tableDept') }}</th>
                <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[180px]">{{ $t('appointments.tableDateTime') }}</th>
                <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[110px]">{{ $t('appointments.tableStatus') }}</th>
                <th class="tw-px-4 lg:tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[150px] tw-text-center">{{ $t('appointments.tableActions') }}</th>
              </tr>
            </thead>
            <tbody class="tw-divide-y tw-divide-slate-100">
              <tr 
                v-for="(item, index) in activeAppointments" 
                :key="item.appointment_id"
                class="hover:tw-bg-slate-50/80 tw-transition-colors"
              >
                <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-text-gray-500 tw-whitespace-nowrap">{{ index + 1 }}</td>
                
                <td class="tw-px-4 lg:tw-px-5 tw-py-4">
                  <div class="tw-font-medium tw-text-gray-800 tw-truncate tw-max-w-[180px]" :title="item.patient_name">{{ item.patient_name }}</div>
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
                  <div class="tw-text-xs tw-text-amber-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
                </td>

                <td class="tw-px-4 lg:tw-px-5 tw-py-4 tw-whitespace-nowrap">
                  <span :class="statusClass(item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                    {{ statusLabel(item.status) }}
                  </span>
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
                      v-if="canCancel"
                      @click="askDeleteAppointment(item)"
                      :disabled="deletingId === item.appointment_id"
                      class="tw-bg-red-500 hover:tw-bg-red-600 disabled:tw-bg-gray-300 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                    >
                      {{ deletingId === item.appointment_id ? $t('common.deleting') :$t('common.delete') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="tw-px-4 sm:tw-px-6 tw-py-3.5 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-xs sm:tw-text-sm tw-text-gray-500">
          {{ $t('common.totalItems', { count: activeAppointments.length }) }}
        </div>
      </div>
    </main>

    <!-- ======= Detail Modal (ครอบด้วย ClientOnly) ======= -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="modal">
          <div 
            v-if="showModal" 
            class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-3 sm:tw-p-4"
          >
            <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeModal"></div>

            <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-max-h-[92vh] tw-flex tw-flex-col tw-overflow-hidden tw-transform tw-transition-all">
              
              <div class="tw-bg-gradient-to-r tw-from-amber-400 tw-to-amber-500 tw-px-5 sm:tw-px-6 tw-py-3.5 sm:tw-py-4">
                <div class="tw-flex tw-items-center tw-justify-between">
                  <h2 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-white">{{ $t('appointments.detailTitle') }}</h2>
                  <button 
                    @click="closeModal"
                    class="tw-text-white/80 hover:tw-text-white tw-transition-colors tw-text-2xl tw-leading-none tw-font-light tw-p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div v-if="selectedAppointment" class="tw-px-4 sm:tw-px-6 tw-py-4 sm:tw-py-5 tw-space-y-4 tw-min-h-0 tw-flex-1 tw-overflow-y-auto">

                <div class="tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-p-4 sm:tw-p-5 tw-flex tw-flex-col tw-items-center tw-gap-3">
                  <div class="tw-text-center">
                    <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.qrLabel') }}</p>
                    <p class="tw-text-xs tw-text-gray-500 tw-mt-0.5">{{ $t('appointments.qrHint') }}</p>
                  </div>

                  <div class="tw-max-w-[180px] sm:tw-max-w-[200px]">
                    <QrCodeDisplay :value="selectedAppointment.qr_token" :size="200" />
                  </div>

                  <p class="tw-w-full tw-text-gray-700 tw-font-mono tw-text-xs sm:tw-text-sm tw-break-all tw-text-center tw-bg-white tw-rounded-lg tw-px-3 tw-py-1.5 tw-border tw-border-slate-200">
                    {{ selectedAppointment.qr_token || $t('appointments.qrTokenNone') }}
                  </p>

                  <div class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2 tw-w-full tw-justify-center">
                    <MapsDirectionsButton
                      :destination="parkingDestination"
                      :coord="PARKING_COORD"
                      :label="$t('appointments.navigateParking')"
                      icon="🅿️"
                    />
                    <MapsDirectionsButton
                      :destination="clinicDestination"
                      :coord="CLINIC_COORD"
                      :label="$t('appointments.navigateClinic')"
                      icon="🏥"
                    />
                  </div>
                </div>

                <div class="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3 sm:tw-gap-4 tw-pt-1">
                  
                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-slate-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-slate-500 tw-text-sm">#</span>
                    </div>
                    <div class="tw-min-w-0">
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.appointmentId') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm tw-truncate">{{ selectedAppointment.appointment_id }}</p>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-blue-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-blue-500 tw-text-sm">👤</span>
                    </div>
                    <div class="tw-min-w-0">
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.patientName') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm tw-truncate">{{ selectedAppointment.patient_name }}</p>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-emerald-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-emerald-500 tw-text-sm">📞</span>
                    </div>
                    <div>
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.phoneNumber') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ selectedAppointment.phone_number || '-' }}</p>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-cyan-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-cyan-500 tw-text-sm">🚗</span>
                    </div>
                    <div>
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.licensePlate') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ selectedAppointment.license_plate }}</p>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-teal-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-teal-500 tw-text-sm">🏥</span>
                    </div>
                    <div class="tw-min-w-0">
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.department') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm tw-truncate">{{ selectedAppointment.department_name || $t('appointments.deptIdFormat', { id: selectedAppointment.dept_id }) }}</p>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-violet-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-violet-500 tw-text-sm">🅿️</span>
                    </div>
                    <div class="tw-min-w-0">
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.building') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm tw-truncate">{{ selectedAppointment.building_name || $t('appointments.buildingFallback') }}</p>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-green-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-green-500 tw-text-sm">📅</span>
                    </div>
                    <div>
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.appointmentDate') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ formatDate(selectedAppointment.appointment_date) }}</p>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-purple-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-purple-500 tw-text-sm">🕐</span>
                    </div>
                    <div>
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.timeSlot') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ selectedAppointment.time_slot }}</p>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-amber-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-amber-500 tw-text-sm">📋</span>
                    </div>
                    <div>
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.status') }}</p>
                      <span :class="statusClass(selectedAppointment.status)" class="tw-inline-block tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-mt-0.5">
                        {{ statusLabel(selectedAppointment.status) }}
                      </span>
                    </div>
                  </div>

                  <div class="tw-flex tw-items-start tw-gap-3">
                    <div class="tw-w-8 tw-h-8 tw-bg-rose-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                      <span class="tw-text-rose-500 tw-text-sm">⏰</span>
                    </div>
                    <div>
                      <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">{{ $t('appointments.createdAt') }}</p>
                      <p class="tw-text-gray-800 tw-font-semibold tw-text-sm">{{ formatDateTime(selectedAppointment.created_at) }}</p>
                    </div>
                  </div>

                </div>
              </div>

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
    </ClientOnly>

    <!-- ======= Delete Confirm Modal (ครอบด้วย ClientOnly) ======= -->
    <ClientOnly>
      <Teleport to="body">
        <Transition name="modal">
          <div 
            v-if="showDeleteModal" 
            class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
          >
            <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeDeleteModal"></div>

            <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transform tw-transition-all">
              
              <div class="tw-p-5 sm:tw-p-6 tw-text-center">
                <h3 class="tw-text-base sm:tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-2">{{ $t('appointments.deleteConfirmTitle') }}</h3>
                <p class="tw-text-xs sm:tw-text-sm tw-text-gray-600 tw-mb-3">
                  {{ $t('appointments.deleteConfirmText', {
                    name: itemToDelete?.patient_name,
                    id: itemToDelete?.appointment_id,
                  }) }}
                </p>
                <p class="tw-text-xs tw-text-amber-600 tw-bg-amber-50 tw-p-2.5 tw-rounded-lg tw-border tw-border-amber-200">
                  {{ $t('appointments.deleteConfirmNote', { days: RETENTION_DAYS }) }}
                </p>
              </div>

              <div class="tw-px-5 sm:tw-px-6 tw-py-3.5 sm:tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-flex-col-reverse sm:tw-flex-row tw-justify-end tw-gap-2 sm:tw-gap-3">
                <button 
                  @click="closeDeleteModal"
                  :disabled="deletingId !== null"
                  class="tw-w-full sm:tw-w-auto tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button 
                  @click="confirmDeleteAppointment"
                  :disabled="deletingId !== null"
                  class="tw-w-full sm:tw-w-auto tw-bg-red-600 hover:tw-bg-red-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm"
                >
                  {{ deletingId !== null ? $t('common.deleting') :$t('appointments.confirmDelete') }}
                </button>
              </div>

            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>

  </div>
</template>

<script setup>
// ============================================================
// Composables
// ============================================================

import { buildParkingDestination, buildClinicDestination, PARKING_COORD, CLINIC_COORD } from '~/constants/clinic'
import { RETENTION_DAYS } from '~/constants/appointments'

// ดึงทั้ง locale และ t สำหรับเรียกแปลภาษาใน script
const { locale, t } = useI18n()
const { statusClass, statusLabel, formatDate, formatDateTime } = useAppointment()
const { canCancel, session } = useSession()

// ============================================================
// State
// ============================================================

const appointments = ref([])
const loading = ref(false)
const errorMsg = ref('')
const deletingId = ref(null)

const activeAppointments = computed(() => {
  return appointments.value.filter(item => item.status !== 'completed' && item.status !== 'cancelled')
})

// Detail Modal State
const showModal = ref(false)
const selectedAppointment = ref(null)

const parkingDestination = computed(() =>
  buildParkingDestination(selectedAppointment.value?.building_name || null),
)
const clinicDestination = computed(() => buildClinicDestination())

// Delete Confirm Modal State
const showDeleteModal = ref(false)
const itemToDelete = ref(null)

// ============================================================
// Data Fetching
// ============================================================

const fetchAppointments = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('/api/appointments', { method: 'GET' })
    appointments.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || t('common.serverError')
    console.error('Fetch appointments error:', error)
  } finally {
    loading.value = false
  }
}

// ============================================================
// Delete Modal Actions
// ============================================================

const askDeleteAppointment = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const confirmDeleteAppointment = async () => {
  if (!itemToDelete.value) return

  const appointmentId = itemToDelete.value.appointment_id
  deletingId.value = appointmentId

  try {
    await $fetch(`/api/appointments/${appointmentId}`, { method: 'DELETE' })

    const targetItem = appointments.value.find(item => item.appointment_id === appointmentId)
    if (targetItem) {
      targetItem.status = 'cancelled'
    }

    closeDeleteModal()
    alert(t('appointments.deleteSuccess', { days: RETENTION_DAYS }))
  } catch (error) {
    const detail = error?.data?.statusMessage || error?.data?.message || error?.message || t('common.unknown')
    alert(t('appointments.deleteError') + ': ' + detail)
    console.error('Delete error details:', { status: error?.status, statusCode: error?.statusCode, detail, full: error })
  } finally {
    deletingId.value = null
  }
}

// ============================================================
// Detail Modal Actions
// ============================================================

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

watch(locale, () => {
  if (!session?.value || !session.value.is_logged_in) return
  fetchAppointments()
})

onMounted(() => {
  fetchAppointments()
})
</script>