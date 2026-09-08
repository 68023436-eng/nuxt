<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="tw-flex-1 tw-min-w-0 tw-p-4 md:tw-p-8">

      <!-- ======== มุมมองของ รปภ.: ประวัติการตรวจสอบของตัวเองเท่านั้น ======== -->
      <div v-if="isGuard">
        <!-- Header Banner -->
        <div class="tw-flex tw-flex-col md:tw-flex-row tw-gap-4 md:tw-items-center md:tw-justify-between tw-bg-sky-100 tw-border-l-8 tw-border-l-sky-600 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
          <div>
            <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">ประวัติการตรวจสอบ</h1>
            <p class="tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">Security Check History</p>
          </div>
          <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <button
              @click="fetchScanHistory"
              :disabled="loading"
              class="tw-bg-white hover:tw-bg-sky-50 disabled:tw-bg-gray-100 tw-text-sky-700 tw-border tw-border-sky-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
            >
              <span>{{ loading ? 'กำลังโหลด...' : 'รีเฟรชประวัติ' }}</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="tw-text-center tw-py-12">
          <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-sky-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
          <p class="tw-text-gray-500 tw-text-lg tw-mt-3">กำลังโหลดประวัติ...</p>
        </div>

        <!-- Error -->
        <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
          <p>เกิดข้อผิดพลาด: {{ errorMsg }}</p>
          <button @click="fetchScanHistory" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800">ลองอีกครั้ง</button>
        </div>

        <!-- Empty -->
        <div v-else-if="scanHistory.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
          <p class="tw-text-gray-400 tw-text-lg">ยังไม่มีประวัติการตรวจสอบ</p>
          <p class="tw-text-gray-400 tw-text-sm tw-mt-1">รายการที่คุณเคยสแกน QR หรือค้นหาเบอร์โทร จะบันทึกไว้ที่นี่</p>
        </div>

        <!-- Guard Scan History Table -->
        <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
          <div class="tw-overflow-x-auto">
            <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[720px]">
              <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
                <tr>
                  <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">ลำดับ</th>
                  <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">ผู้ถูกตรวจสอบ</th>
                  <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">วันที่ / เวลา</th>
                  <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">วิธีตรวจสอบ</th>
                  <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">ผลการตรวจสอบ</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in scanHistory"
                  :key="item.id"
                  class="tw-border-b tw-border-slate-100 hover:tw-bg-slate-50 tw-transition-colors"
                >
                  <td class="tw-px-5 tw-py-4 tw-text-gray-500">{{ index + 1 }}</td>
                  <td class="tw-px-5 tw-py-4">
                    <div class="tw-text-gray-800 tw-font-medium">{{ item.patient_name || 'ไม่ทราบชื่อ' }}</div>
                    <div v-if="item.phone_number" class="tw-text-xs tw-text-slate-500 tw-mt-0.5 tw-font-mono">
                      {{ item.phone_number }}
                    </div>
                  </td>
                  <td class="tw-px-5 tw-py-4 tw-text-gray-800">{{ formatDateTime(item.created_at) }}</td>
                  <td class="tw-px-5 tw-py-4">
                    <span class="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-gray-700">
                      {{ item.method === 'qr' ? '📷 สแกน QR Code' : '📞 ค้นหาเบอร์โทร' }}
                    </span>
                  </td>
                  <td class="tw-px-5 tw-py-4">
                    <span
                      :class="item.result === 'valid'
                        ? 'tw-bg-green-100 tw-text-green-700'
                        : 'tw-bg-red-100 tw-text-red-700'"
                      class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium"
                    >
                      {{ item.result === 'valid' ? '✓ มีสิทธิ์' : '✕ ไม่มีสิทธิ์' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="tw-px-6 tw-py-3 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-sm tw-text-gray-500">
            ทั้งหมด {{ scanHistory.length }} รายการ
          </div>
        </div>
      </div>

      <!-- ======== มุมมองของผู้ใช้ทั่วไป (Patient): นัดหมายทั้งหมดของตัวเอง ======== -->
      <template v-else-if="isPatient">
        <!-- Header Banner พร้อมปุ่มรีเฟรช -->
        <div class="tw-flex tw-flex-col md:tw-flex-row tw-gap-4 md:tw-items-center md:tw-justify-between tw-bg-cyan-100 tw-border-l-8 tw-border-l-cyan-600 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
          <div>
            <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">ประวัติการนัดหมายของฉัน</h1>
            <p class="tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">My Appointment History</p>
          </div>
          <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
            <button
              @click="fetchHistory"
              :disabled="loading"
              class="tw-bg-white hover:tw-bg-cyan-50 disabled:tw-bg-gray-100 tw-text-cyan-700 tw-border tw-border-cyan-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
            >
              <span>{{ loading ? 'กำลังโหลด...' : 'รีเฟรชประวัติ' }}</span>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="tw-text-center tw-py-12">
          <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-cyan-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
          <p class="tw-text-gray-500 tw-text-lg tw-mt-3">กำลังโหลดประวัติ...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
          <p>เกิดข้อผิดพลาด: {{ errorMsg }}</p>
          <button @click="fetchHistory" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800">ลองอีกครั้ง</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="upcomingAppointments.length === 0 && pastAppointments.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
          <p class="tw-text-gray-400 tw-text-lg">ยังไม่มีประวัติการนัดหมาย</p>
          <p class="tw-text-gray-400 tw-text-sm tw-mt-1">นัดหมายของคุณทั้งหมดจะแสดงอยู่ที่นี่</p>
        </div>

        <template v-else>
          <!-- ==== ส่วน A: นัดที่จะมาถึง (วันนัด >= วันนี้) ==== -->
          <section v-if="upcomingAppointments.length > 0" class="tw-mb-8">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <h2 class="tw-text-lg tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
                <span>🗓️</span> นัดที่จะมาถึง
              </h2>
              <span class="tw-text-sm tw-text-gray-500">ทั้งหมด {{ upcomingAppointments.length }} รายการ</span>
            </div>
            <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
              <div class="tw-overflow-x-auto">
                <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[920px]">
                  <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
                    <tr>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-12">ลำดับ</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[200px]">ชื่อผู้ป่วย / เบอร์โทร</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[140px]">ทะเบียนรถ</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[200px]">แผนกตรวจ</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[190px]">วันและเวลานัดหมาย</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[110px]">สถานะ</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[150px] tw-text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in upcomingAppointments"
                      :key="item.appointment_id"
                      class="tw-border-b tw-border-slate-100 hover:tw-bg-slate-50 tw-transition-colors"
                    >
                      <td class="tw-px-5 tw-py-4 tw-text-gray-500 tw-whitespace-nowrap">{{ index + 1 }}</td>
                      <td class="tw-px-5 tw-py-4">
                        <div class="tw-font-medium tw-text-gray-800 tw-truncate tw-max-w-[190px]" :title="item.patient_name">{{ item.patient_name }}</div>
                        <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5 tw-whitespace-nowrap">{{ item.phone_number || '-' }}</div>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                          {{ item.license_plate }}
                        </span>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-text-gray-700">
                        <span class="tw-line-clamp-2">{{ item.department_name || item.dept_id || '-' }}</span>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                        <div class="tw-text-xs tw-text-cyan-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <span :class="statusClass(item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                          {{ statusLabel(item.status) }}
                        </span>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-text-center tw-whitespace-nowrap">
                        <button
                          @click="openDetail(item)"
                          class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                        >
                          ดูเพิ่มเติม
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- ==== ส่วน B: ประวัติ (วันนัด < วันนี้) ==== -->
          <section v-if="pastAppointments.length > 0">
            <div class="tw-flex tw-items-center tw-justify-between tw-mb-3">
              <h2 class="tw-text-lg tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
                <span>📜</span> ประวัติ
              </h2>
              <span class="tw-text-sm tw-text-gray-500">ทั้งหมด {{ pastAppointments.length }} รายการ</span>
            </div>
            <div class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
              <div class="tw-overflow-x-auto">
                <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[920px]">
                  <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
                    <tr>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-12">ลำดับ</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[200px]">ชื่อผู้ป่วย / เบอร์โทร</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[140px]">ทะเบียนรถ</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[200px]">แผนกตรวจ</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[190px]">วันและเวลานัดหมาย</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[110px]">สถานะ</th>
                      <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[150px] tw-text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in pastAppointments"
                      :key="item.appointment_id"
                      class="tw-border-b tw-border-slate-100 hover:tw-bg-slate-50 tw-transition-colors"
                    >
                      <td class="tw-px-5 tw-py-4 tw-text-gray-500 tw-whitespace-nowrap">{{ index + 1 }}</td>
                      <td class="tw-px-5 tw-py-4">
                        <div class="tw-font-medium tw-text-gray-800 tw-truncate tw-max-w-[190px]" :title="item.patient_name">{{ item.patient_name }}</div>
                        <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5 tw-whitespace-nowrap">{{ item.phone_number || '-' }}</div>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                          {{ item.license_plate }}
                        </span>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-text-gray-700">
                        <span class="tw-line-clamp-2">{{ item.department_name || item.dept_id || '-' }}</span>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                        <div class="tw-text-xs tw-text-cyan-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                        <span :class="statusClass(item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                          {{ statusLabel(item.status) }}
                        </span>
                      </td>
                      <td class="tw-px-5 tw-py-4 tw-text-center tw-whitespace-nowrap">
                        <button
                          @click="openDetail(item)"
                          class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                        >
                          ดูเพิ่มเติม
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

      <!-- ======== มุมมองของเจ้าหน้าที่/Admin: ประวัตินัดหมาย + กู้คืน ======== -->
      <template v-else>
      <!-- Header Banner พร้อมปุ่มรีเฟรช -->
      <div class="tw-flex tw-flex-col md:tw-flex-row tw-gap-4 md:tw-items-center md:tw-justify-between tw-bg-purple-100 tw-border-l-8 tw-border-l-purple-600 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
        <div>
          <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">การเก็บประวัตินัดหมาย</h1>
          <p class="tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">Appointments History</p>
        </div>

        <!-- ปุ่มรีเฟรชข้อมูล -->
        <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <button 
            v-if="canManage"
            @click="purgeExpired"
            :disabled="purging"
            class="tw-bg-white hover:tw-bg-red-50 disabled:tw-bg-gray-100 tw-text-red-600 tw-border tw-border-red-200 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
          >
            <span>{{ purging ? 'กำลังล้าง...' : 'ล้างข้อมูลที่หมดอายุ' }}</span>
          </button>
          <button 
            @click="fetchHistory" 
            :disabled="loading"
            class="tw-bg-white hover:tw-bg-purple-50 disabled:tw-bg-gray-100 tw-text-purple-800 tw-border tw-border-purple-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
          >
            <span>{{ loading ? 'กำลังโหลด...' : 'รีเฟรชประวัติ' }}</span>
          </button>
        </div>
      </div>

      <!-- ระบบลบแบบเก็บ 30 วัน -->
      <div class="tw-mb-6 tw-bg-indigo-50 tw-border tw-border-indigo-200 tw-p-4 tw-rounded-xl tw-text-indigo-800 tw-text-sm tw-flex tw-items-start tw-gap-3">
        <div>
          <p class="tw-text-indigo-600 tw-mt-0.5">
            รายการที่ถูกลบจะอยู่ในประวัติเป็นเวลา 30 วัน (1 เดือน) 
            ซึ่งสามารถกู้คืนได้ตลอดช่วงเวลานี้ หากครบ 30 วัน ข้อมูลจะถูกลบออกจากระบบอัตโนมัติโดยไม่สามารถกู้คืนได้อีก
          </p>
        </div>
      </div>

      <!-- Action bar: กู้คืนแบบกลุ่ม (เลือกหลายรายการ / กู้คืนทั้งหมด) -->
      <div v-if="canRestore && historyAppointments.length > 0" class="tw-mb-6 tw-bg-white tw-border tw-border-slate-200 tw-rounded-xl tw-p-4 tw-shadow-sm">
        <div class="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          <div class="tw-w-full sm:tw-w-auto tw-text-sm tw-text-gray-700">
            <span class="tw-font-semibold">กู้คืนข้อมูล</span>
            <span class="tw-text-gray-400 tw-ml-1">เลือกในตารางเพื่อกู้คืนพร้อมกัน หรือกู้คืนทั้งหมด</span>
          </div>
          <div class="tw-flex-1 tw-hidden sm:tw-block"></div>
          <button
            :disabled="selectedIds.length === 0 || restoringAll"
            @click="askBatchRestore(selectedIds, 'selected')"
            class="tw-w-full sm:tw-w-auto tw-bg-indigo-600 hover:tw-bg-indigo-700 disabled:tw-bg-gray-300 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-colors"
          >
            กู้คืนที่เลือก (<span class="tw-font-bold">{{ selectedIds.length }}</span>)
          </button>
          <button
            :disabled="historyAppointments.length === 0 || restoringAll"
            @click="askBatchRestore(historyAppointments.map(a => a.appointment_id), 'all')"
            class="tw-w-full sm:tw-w-auto tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-300 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-colors"
          >
            กู้คืนทั้งหมด (<span class="tw-font-bold">{{ historyAppointments.length }}</span>)
          </button>
          <button
            v-if="selectedIds.length > 0"
            @click="selectedIds = []"
            class="tw-text-sm tw-text-gray-500 hover:tw-text-gray-700 tw-underline tw-whitespace-nowrap"
          >
            ล้างการเลือก
          </button>
        </div>
      </div>

      <!-- Success Notification Toast -->
      <div v-if="toastMsg" class="tw-mb-6 tw-bg-green-50 tw-border tw-border-green-200 tw-p-4 tw-rounded-xl tw-text-green-700 tw-text-sm tw-flex tw-items-center tw-justify-between tw-shadow-sm">
        <div class="tw-flex tw-items-center tw-gap-2">
          <span class="tw-text-lg">✅</span>
          <span>{{ toastMsg }}</span>
        </div>
        <button @click="toastMsg = ''" class="tw-text-green-500 hover:tw-text-green-700 tw-font-bold">✕</button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="tw-text-center tw-py-12">
        <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-purple-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
        <p class="tw-text-gray-500 tw-text-lg tw-mt-3">กำลังโหลดประวัติ...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
        <p>เกิดข้อผิดพลาด: {{ errorMsg }}</p>
        <button @click="fetchHistory" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800">ลองอีกครั้ง</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="historyAppointments.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-8 sm:tw-p-12 tw-rounded-2xl tw-text-center">
        <p class="tw-text-gray-400 tw-text-lg">ยังไม่มีรายการประวัติที่ถูกลบหรือยกเลิก</p>
        <p class="tw-text-gray-400 tw-text-sm tw-mt-1">รายการนัดหมายที่ถูกลบออกจากหน้ารายการนัดหมายจะมาแสดงที่นี่</p>
      </div>

      <!-- Data Table -->
      <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
        <div class="tw-overflow-x-auto">
        <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[1020px]">
          <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
            <tr>
              <th v-if="canRestore" class="tw-px-5 tw-py-4 tw-w-10">
                <input
                  type="checkbox"
                  :checked="allItemsSelected"
                  @change="toggleSelectAll"
                  class="tw-w-4 tw-h-4 tw-accent-indigo-600 tw-cursor-pointer"
                />
              </th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-12">ลำดับ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[220px]">ชื่อผู้ป่วย / เบอร์โทร</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[130px]">ทะเบียนรถ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[200px]">แผนกตรวจ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[190px]">วันและเวลานัดหมาย</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[110px]">สถานะ</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[210px]">ลบถาวรเมื่อครบ 30 วัน</th>
              <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-whitespace-nowrap tw-w-[190px] tw-text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(item, index) in historyAppointments" 
              :key="item.appointment_id"
              :class="[
                'tw-border-b tw-border-slate-100 tw-transition-colors',
                isSelected(item.appointment_id) ? 'tw-bg-indigo-50/70' : 'hover:tw-bg-slate-50'
              ]"
            >
              <td v-if="canRestore" class="tw-px-5 tw-py-4 tw-w-10">
                <input
                  type="checkbox"
                  :checked="isSelected(item.appointment_id)"
                  @change="toggleSelect(item)"
                  class="tw-w-4 tw-h-4 tw-accent-indigo-600 tw-cursor-pointer"
                />
              </td>
              <td class="tw-px-5 tw-py-4 tw-text-gray-500 tw-whitespace-nowrap">{{ index + 1 }}</td>
              <td class="tw-px-5 tw-py-4">
                <div class="tw-font-medium tw-text-gray-800 tw-truncate tw-max-w-[210px]" :title="item.patient_name">{{ item.patient_name }}</div>
                <div class="tw-text-xs tw-text-gray-400 tw-mt-0.5 tw-whitespace-nowrap">{{ item.phone_number || '-' }}</div>
              </td>
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <span class="tw-inline-block tw-bg-slate-100 tw-border tw-border-slate-200 tw-text-gray-800 tw-font-bold tw-px-2.5 tw-py-1 tw-rounded-md tw-text-xs">
                  {{ item.license_plate }}
                </span>
              </td>
              <td class="tw-px-5 tw-py-4 tw-text-gray-700">
                <span class="tw-line-clamp-2">{{ item.department_name || item.dept_id || '-' }}</span>
              </td>
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <div class="tw-text-gray-700">{{ formatDate(item.appointment_date) }}</div>
                <div class="tw-text-xs tw-text-purple-600 tw-font-medium tw-mt-0.5">{{ item.time_slot }}</div>
              </td>
              <td class="tw-px-5 tw-py-4 tw-whitespace-nowrap">
                <span :class="statusClass(item.status)" class="tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td class="tw-px-5 tw-py-4">
                <template v-if="item.deleted_at">
                  <div class="tw-text-xs tw-text-gray-500 tw-whitespace-nowrap">ลบเมื่อ {{ formatDateTime(item.deleted_at) }}</div>
                  <div class="tw-text-xs tw-font-semibold tw-mt-0.5 tw-whitespace-nowrap" :class="daysUntilPurge(item.deleted_at, item.days_until_purge) !== null && daysUntilPurge(item.deleted_at, item.days_until_purge) <= 7 ? 'tw-text-red-600' : 'tw-text-indigo-600'">
                    {{ purgeNotice(item.deleted_at, item.days_until_purge) }}
                  </div>
                </template>
                <template v-else>
                  <span class="tw-text-xs tw-text-gray-400 tw-whitespace-nowrap">-</span>
                </template>
              </td>
              <td class="tw-px-5 tw-py-4 tw-text-center tw-whitespace-nowrap">
                <div class="tw-flex tw-justify-center tw-gap-2">
                  <!-- ปุ่มดูเพิ่มเติม -->
                  <button 
                    @click="openDetail(item)"
                    class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                  >
                    ดูเพิ่มเติม
                  </button>
                  <!-- ปุ่มกู้กลับ -->
                  <button 
                    v-if="canRestore"
                    @click="askRestoreAppointment(item)"
                    :disabled="restoringId === item.appointment_id"
                    class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-300 tw-text-white tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors tw-shadow-sm tw-flex tw-items-center tw-gap-1"
                  >
                    <span>{{ restoringId === item.appointment_id ? 'กำลังกู้คืน...' : ' กู้กลับ' }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <!-- Summary -->
        <div class="tw-px-6 tw-py-3 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-sm tw-text-gray-500">
          ประวัติทั้งหมด {{ historyAppointments.length }} รายการ
        </div>
      </div>
      </template>

    </div>

    <!-- ======= Detail Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
        >
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeModal"></div>

          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-overflow-hidden tw-transform tw-transition-all tw-max-h-[90vh] tw-flex tw-flex-col">
            <!-- Modal Header -->
            <div class="tw-bg-gradient-to-r tw-from-purple-500 tw-to-indigo-600 tw-px-6 tw-py-4">
              <div class="tw-flex tw-items-center tw-justify-between">
                <h2 class="tw-text-lg tw-font-bold tw-text-white">รายละเอียดประวัตินัดหมาย</h2>
                <button 
                  @click="closeModal"
                  class="tw-text-white/80 hover:tw-text-white tw-transition-colors tw-text-2xl tw-leading-none tw-font-light"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Modal Body -->
            <div v-if="selectedAppointment" class="tw-px-6 tw-py-5 tw-space-y-4 tw-overflow-y-auto">
              <!-- Appointment ID -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-slate-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-slate-500 tw-text-sm">#</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">รหัสนัดหมาย</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.appointment_id }}</p>
                </div>
              </div>

              <!-- ชื่อผู้ป่วย -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-blue-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-blue-500 tw-text-sm">👤</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">ชื่อผู้ป่วย</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.patient_name }}</p>
                </div>
              </div>

              <!-- เบอร์โทรศัพท์ -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-emerald-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-emerald-500 tw-text-sm">📞</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">เบอร์โทรศัพท์</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.phone_number || '-' }}</p>
                </div>
              </div>

              <!-- ทะเบียนรถยนต์ -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-cyan-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-cyan-500 tw-text-sm">🚗</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">ทะเบียนรถยนต์</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.license_plate }}</p>
                </div>
              </div>

              <!-- แผนกตรวจ -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-teal-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-teal-500 tw-text-sm">🏥</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">แผนกตรวจ</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.department_name || selectedAppointment.dept_id }}</p>
                </div>
              </div>

              <!-- วันนัดหมาย -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-green-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-green-500 tw-text-sm">📅</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">วันนัดหมาย</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ formatDate(selectedAppointment.appointment_date) }}</p>
                </div>
              </div>

              <!-- ช่วงเวลา -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-purple-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-purple-500 tw-text-sm">🕐</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">ช่วงเวลา</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ selectedAppointment.time_slot }}</p>
                </div>
              </div>

              <!-- QR Code -->
              <div class="tw-bg-slate-50 tw-border tw-border-slate-200 tw-rounded-xl tw-p-4 tw-flex tw-flex-col tw-items-center tw-gap-2">
                <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">QR TOKEN</p>
                <QrCodeDisplay :value="selectedAppointment.qr_token" :size="144" />
              </div>

              <!-- สถานะ -->
              <div class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-amber-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-amber-500 tw-text-sm">📋</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">สถานะ</p>
                  <span :class="statusClass(selectedAppointment.status)" class="tw-inline-block tw-px-3 tw-py-1 tw-rounded-full tw-text-sm tw-font-medium tw-mt-0.5">
                    {{ statusLabel(selectedAppointment.status) }}
                  </span>
                </div>
              </div>

              <!-- กำหนดการลบถาวร -->
              <div v-if="selectedAppointment.deleted_at" class="tw-flex tw-items-start tw-gap-3">
                <div class="tw-w-8 tw-h-8 tw-bg-rose-50 tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                  <span class="tw-text-rose-500 tw-text-sm">🗑️</span>
                </div>
                <div>
                  <p class="tw-text-xs tw-text-gray-400 tw-font-medium tw-uppercase tw-tracking-wider">การลบถาวร</p>
                  <p class="tw-text-gray-800 tw-font-semibold">{{ purgeNotice(selectedAppointment.deleted_at, selectedAppointment.days_until_purge) }}</p>
                  <p class="tw-text-xs tw-text-gray-500 tw-mt-0.5">ถูกลบเมื่อ {{ formatDateTime(selectedAppointment.deleted_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end">
              <button 
                @click="closeModal"
                class="tw-bg-slate-200 hover:tw-bg-slate-300 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ======= Restore Confirm Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showRestoreModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
        >
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeRestoreModal"></div>

          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transform tw-transition-all tw-max-h-[90vh] tw-overflow-y-auto">
            <div class="tw-p-6 tw-text-center">
              <h3 class="tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-2">ยืนยันการกู้คืนข้อมูล</h3>
              <p class="tw-text-sm tw-text-gray-600 tw-mb-4">
                คุณต้องการกู้คืนรายการนัดหมายของ 
                <strong class="tw-text-gray-800 tw-font-semibold">{{ itemToRestore?.patient_name }}</strong> 
                (ID: {{ itemToRestore?.appointment_id }}) กลับไปยังหน้ารายการนัดหมายใช่หรือไม่?
              </p>
              <p class="tw-text-xs tw-text-purple-700 tw-bg-purple-50 tw-p-3 tw-rounded-xl tw-border tw-border-purple-200">
                เมื่อกู้คืนแล้ว สถานะรายการจะถูกเปลี่ยนเป็น <strong>"ข้อมูล backup"</strong> และนำกลับไปแสดงในหน้ารายการนัดหมายทันที 
                พร้อมกับหยุดนับเวลาการลบถาวร (ข้อมูลจะไม่ถูกลบออกโดยอัตโนมัติอีกต่อไป)
              </p>
            </div>

            <!-- Modal Footer -->
            <div class="tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end tw-gap-3">
              <button 
                @click="closeRestoreModal"
                :disabled="restoringId !== null"
                class="tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                @click="confirmRestoreAppointment"
                :disabled="restoringId !== null"
                class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm"
              >
                {{ restoringId !== null ? 'กำลังกู้คืน...' : 'ยืนยันกู้คืนข้อมูล' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ======= Batch Restore Confirm Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showBatchRestoreModal" 
          class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4"
        >
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeBatchRestoreModal"></div>

          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-md tw-overflow-hidden tw-transform tw-transition-all tw-max-h-[90vh] tw-overflow-y-auto">
            <div class="tw-p-6 tw-text-center">
              <h3 class="tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-2">ยืนยันการกู้คืนข้อมูล{{ batchRestoreMode === 'all' ? 'ทั้งหมด' : 'ที่เลือก' }}</h3>
              <p class="tw-text-sm tw-text-gray-600 tw-mb-4">
                คุณต้องการกู้คืนรายการนัดหมายทั้งหมด
                <strong class="tw-text-indigo-700 tw-font-semibold">{{ batchRestoreIds.length }} รายการ</strong>
                กลับไปยังหน้ารายการนัดหมายใช่หรือไม่?
              </p>
              <p class="tw-text-xs tw-text-purple-700 tw-bg-purple-50 tw-p-3 tw-rounded-xl tw-border tw-border-purple-200">
                เมื่อกู้คืนแล้ว รายการทั้งหมดจะถูกเปลี่ยนเป็น <strong>"ข้อมูล backup"</strong> และนำกลับไปแสดงในหน้ารายการนัดหมายทันที 
                พร้อมกับหยุดนับเวลาการลบถาวร (ข้อมูลจะไม่ถูกลบออกโดยอัตโนมัติอีกต่อไป)
              </p>
            </div>

            <!-- Modal Footer -->
            <div class="tw-px-6 tw-py-4 tw-bg-slate-50 tw-border-t tw-border-slate-100 tw-flex tw-justify-end tw-gap-3">
              <button 
                @click="closeBatchRestoreModal"
                :disabled="restoringAll"
                class="tw-bg-slate-200 hover:tw-bg-slate-300 disabled:tw-opacity-50 tw-text-gray-700 tw-font-medium tw-py-2 tw-px-4 tw-rounded-lg tw-text-sm tw-transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                @click="confirmBatchRestore"
                :disabled="restoringAll"
                class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm"
              >
                {{ restoringAll ? 'กำลังกู้คืน...' : 'ยืนยันกู้คืนข้อมูล' }}
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

const { statusClass, statusLabel, formatDate, formatDateTime, daysUntilPurge, purgeNotice } = useAppointment()

const { session, role, canRestore, canManage } = useSession()

// รปภ. เห็นเฉพาะประวัติการตรวจสอบของตัวเอง (ไม่ใช่ประวัตินัดหมายของผู้ป่วย)
const isGuard = computed(() => role.value === 'Security_guard')

// ผู้ใช้ทั่วไปเห็นเฉพาะประวัตินัดหมายของตัวเอง (ทุกสถานะ)
const isPatient = computed(() => role.value === 'Patient')

// ============================================================
// State
// ============================================================

const appointments = ref([])
const loading = ref(false)
const errorMsg = ref('')
const restoringId = ref(null)
const purging = ref(false)
const toastMsg = ref('')

// ประวัติการตรวจสอบของ รปภ. (จากตาราง scan_history)
const scanHistory = ref([])

// State สำหรับเลือกหลายรายการเพื่อกู้คืนพร้อมกัน
const selectedIds = ref([])
const restoringAll = ref(false)

// Batch Restore Confirm Modal State
const showBatchRestoreModal = ref(false)
const batchRestoreIds = ref([])
const batchRestoreMode = ref('selected')

// กรองเอาเฉพาะรายการที่ถูกยกเลิก (cancelled) หรือเสร็จสิ้น (completed)
const historyAppointments = computed(() => {
  return appointments.value.filter(item => item.status === 'cancelled' || item.status === 'completed')
})

// ผู้ใช้ทั่วไป (Patient): แบ่งเป็น
//  - นัดที่จะมาถึง (appointment_date >= วันนี้ ตาม server/Asia/Bangkok)
//  - ประวัติ (appointment_date < วันนี้)
// ใช้วันจาก server (session.server_today) ไม่ใช่ clock ของ browser
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

// เลือกครบทุกแถวในตารางหรือยัง
const allItemsSelected = computed(() => {
  return historyAppointments.value.length > 0 &&
    historyAppointments.value.every(a => isSelected(a.appointment_id))
})

// ============================================================
// ระบบเลือกหลายรายการ (checkbox)
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

// Detail Modal State
const showModal = ref(false)
const selectedAppointment = ref(null)

// Restore Confirm Modal State
const showRestoreModal = ref(false)
const itemToRestore = ref(null)

// ============================================================
// ดึงประวัติจาก Nuxt Server API
// ============================================================

const fetchHistory = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('/api/appointments', { method: 'GET' })
    appointments.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'ไม่สามารถดึงข้อมูลประวัติได้'
  } finally {
    loading.value = false
  }
}

// ดึงเฉพาะประวัติการตรวจสอบของ รปภ. คนปัจจุบัน (สแกน QR / ค้นหาเบอร์)
const fetchScanHistory = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch('/api/scan/history', { method: 'GET' })
    scanHistory.value = data || []
  } catch (error) {
    errorMsg.value = error?.data?.statusMessage || error?.message || 'ไม่สามารถดึงประวัติการตรวจสอบได้'
  } finally {
    loading.value = false
  }
}

// ============================================================
// Purge: ลบข้อมูลที่หมดอายุ (Deleted > 30 วัน) ออกจากระบบ
// ============================================================

const purgeExpired = async () => {
  purging.value = true
  try {
    const res = await $fetch('/api/cleanup/purge', { method: 'POST' })
    toastMsg.value = res?.message || 'ล้างข้อมูลที่หมดอายุแล้ว'
    await fetchHistory()
    setTimeout(() => {
      toastMsg.value = ''
    }, 4000)
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + (error?.data?.statusMessage || error?.message || 'ไม่ทราบสาเหตุ'))
    console.error('Purge error:', error)
  } finally {
    purging.value = false
  }
}

// ============================================================
// Batch Restore: กู้คืนหลายรายการพร้อมกัน / กู้คืนทั้งหมด
// ============================================================

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

    // อัปเดตสถานะในหน้าเว็บให้รายการที่กู้คืนเปลี่ยนเป็น backup (จะหลุดจากตารางประวัติโดยอัตโนมัติ)
    const restoredSet = new Set(batchRestoreIds.value)
    appointments.value = appointments.value.map(i =>
      restoredSet.has(i.appointment_id) ? { ...i, status: 'backup', deleted_at: null } : i
    )

    selectedIds.value = []
    closeBatchRestoreModal()
    showToast(`กู้คืนข้อมูลสำเร็จ ${count} รายการ! สถานะเปลี่ยนเป็น "ข้อมูล backup"`)
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการกู้คืน: ' + (error?.data?.statusMessage || error?.message || 'ไม่ทราบสาเหตุ'))
    console.error('Batch restore error:', error)
  } finally {
    restoringAll.value = false
  }
}

// ============================================================
// Restore Modal Actions
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

    // อัปเดตในตารางฝั่งหน้าเว็บให้เป็น 'backup' ทันที (จะหลุดออกจากตัวกรอง historyAppointments อัตโนมัติ)
    const item = appointments.value.find(i => i.appointment_id === appointmentId)
    if (item) {
      item.status = 'backup'
    } else {
      appointments.value = appointments.value.filter(i => i.appointment_id !== appointmentId)
    }

    toastMsg.value = `กู้คืนข้อมูลของ "${patientName}" สำเร็จ! สถานะเปลี่ยนเป็น "ข้อมูล backup"`
    closeRestoreModal()

    setTimeout(() => {
      toastMsg.value = ''
    }, 4000)
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการกู้คืน: ' + (error?.data?.statusMessage || error?.message || 'ไม่ทราบสาเหตุ'))
    console.error('Restore error:', error)
  } finally {
    restoringId.value = null
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

onMounted(() => {
  if (isGuard.value) {
    fetchScanHistory()
    return
  }
  fetchHistory()
  // ถ้าเป็น Admin จะล้างข้อมูลที่หมดอายุทิ้งให้อัตโนมัติตอนเข้าเพจ
  if (canManage.value) {
    purgeExpired()
  }
})
</script>