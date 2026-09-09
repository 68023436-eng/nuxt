<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="tw-flex-1 tw-p-6 lg:tw-p-8 tw-min-w-0">
      <!-- Header Banner พร้อมปุ่มเพิ่ม -->
      <div class="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center tw-bg-emerald-100 tw-border-l-8 tw-border-l-emerald-500 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-6 tw-gap-4">
        <div>
          <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">จัดการเจ้าหน้าที่</h1>
          <p class="tw-text-sm tw-text-slate-600 tw-font-mono tw-mt-1">Manage Staff Accounts &amp; Access</p>
          <p class="tw-text-xs tw-text-slate-500 tw-mt-1">รวม {{ stats.total }} คน — ใช้งาน {{ stats.active }} คน / ปิด {{ stats.inactive }} คน</p>
        </div>
        <div class="tw-flex tw-items-center tw-gap-3 tw-flex-wrap">
          <button
            @click="fetchStaff"
            :disabled="loading"
            class="tw-bg-white hover:tw-bg-emerald-50 disabled:tw-bg-gray-100 tw-text-emerald-800 tw-border tw-border-emerald-300 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
          >
            <svg v-if="!loading" class="tw-w-4 tw-h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
          </button>
          <button
            @click="openCreate"
            class="tw-bg-emerald-600 hover:tw-bg-emerald-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-shadow-sm tw-flex tw-items-center tw-gap-2 tw-transition-colors"
          >
            <svg class="tw-w-4 tw-h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M12 5v14M5 12h14" />
            </svg>
            เพิ่มเจ้าหน้าที่
          </button>
        </div>
      </div>

      <!-- Toolbar: Search + Role Filter -->
      <div v-if="!loading && !errorMsg" class="tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-items-stretch sm:tw-items-center tw-mb-4">
        <div class="tw-relative tw-flex-1 sm:tw-max-w-sm">
          <svg class="tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-w-4 tw-h-4 tw-text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร..."
            class="tw-w-full tw-pl-9 tw-pr-3 tw-py-2 tw-border tw-border-slate-200 tw-rounded-lg tw-text-sm tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400 tw-bg-white"
          />
        </div>
        <div class="tw-flex tw-items-center tw-gap-1.5 tw-flex-wrap">
          <button
            v-for="f in roleFilters"
            :key="f.value"
            @click="roleFilter = f.value"
            :class="roleFilter === f.value
              ? 'tw-bg-emerald-600 tw-text-white tw-border-emerald-600'
              : 'tw-bg-white tw-text-slate-600 tw-border-slate-200 hover:tw-border-emerald-300 hover:tw-text-emerald-700'"
            class="tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-border tw-transition-colors"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="tw-text-center tw-py-16">
        <div class="tw-inline-block tw-w-8 tw-h-8 tw-border-4 tw-border-emerald-400 tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
        <p class="tw-text-gray-500 tw-text-lg tw-mt-3">กำลังโหลดข้อมูล...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="tw-bg-red-50 tw-border tw-border-red-200 tw-p-4 tw-rounded-xl tw-text-red-600">
        <p>เกิดข้อผิดพลาด: {{ errorMsg }}</p>
        <button @click="fetchStaff" class="tw-mt-2 tw-text-sm tw-underline hover:tw-text-red-800">ลองอีกครั้ง</button>
      </div>

      <!-- Empty -->
      <div v-else-if="staffList.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-12 tw-rounded-2xl tw-text-center">
        <div class="tw-text-4xl tw-mb-2">👤</div>
        <p class="tw-text-gray-400 tw-text-lg">ยังไม่มีเจ้าหน้าที่ในระบบ</p>
        <p class="tw-text-gray-300 tw-text-sm tw-mt-1">กดปุ่ม "เพิ่มเจ้าหน้าที่" เพื่อสร้างบัญชีแรก</p>
      </div>

      <!-- Empty (filtered) -->
      <div v-else-if="filteredStaff.length === 0" class="tw-bg-white tw-border tw-border-slate-200 tw-p-10 tw-rounded-2xl tw-text-center">
        <div class="tw-text-3xl tw-mb-2">🔍</div>
        <p class="tw-text-gray-400 tw-text-lg">ไม่พบรายการที่ตรงกับการค้นหา</p>
        <button @click="resetFilters" class="tw-mt-2 tw-text-sm tw-text-emerald-600 tw-underline hover:tw-text-emerald-700">ล้างตัวกรอง</button>
      </div>

      <!-- Table -->
      <div v-else class="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-overflow-hidden">
        <div class="tw-overflow-x-auto">
          <table class="tw-w-full tw-text-sm tw-text-left tw-min-w-[720px]">
            <thead class="tw-bg-slate-50 tw-border-b tw-border-slate-200">
              <tr>
                <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-w-14">ลำดับ</th>
                <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">ชื่อ-นามสกุล</th>
                <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">บทบาท</th>
                <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">เบอร์โทร</th>
                <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">อีเมล</th>
                <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700">สถานะ</th>
                <th class="tw-px-5 tw-py-4 tw-font-semibold tw-text-gray-700 tw-text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in filteredStaff"
                :key="item.user_id"
                :class="{ 'tw-bg-emerald-50/40': hydrated && isSelf(item) }"
                class="tw-border-b tw-border-slate-100 hover:tw-bg-slate-50 tw-transition-colors"
              >
                <td class="tw-px-5 tw-py-4 tw-text-gray-400 tw-text-xs">{{ index + 1 }}</td>
                <td class="tw-px-5 tw-py-4">
                  <div class="tw-flex tw-items-center tw-gap-3">
                    <div :class="roleAvatarClass(item.role)" class="tw-w-9 tw-h-9 tw-rounded-full tw-text-white tw-flex tw-items-center tw-justify-center tw-font-bold tw-flex-shrink-0">
                      {{ (item.full_name || '?').charAt(0) }}
                    </div>
                    <div class="tw-min-w-0">
                      <div class="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                        <span class="tw-font-medium tw-text-gray-800">{{ item.full_name }}</span>
                        <span v-if="hydrated && isSelf(item)" class="tw-inline-block tw-bg-sky-100 tw-text-sky-700 tw-text-xs tw-font-medium tw-px-2 tw-py-0.5 tw-rounded-full">คุณ</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="tw-px-5 tw-py-4">
                  <span :class="roleBadgeClass(item.role)" class="tw-inline-block tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold">
                    {{ roleLabel(item.role) }}
                  </span>
                </td>
                <td class="tw-px-5 tw-py-4 tw-text-gray-700">
                  <span class="tw-inline-flex tw-items-center tw-gap-1.5">
                    <svg v-if="item.phone_number" class="tw-w-3.5 tw-h-3.5 tw-text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.34 1.15L7.4 9.99a13.02 13.02 0 005.06 5.06l1.56-1.69a1 1 0 011.15-.34l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                    </svg>
                    {{ item.phone_number || '-' }}
                  </span>
                </td>
                <td class="tw-px-5 tw-py-4 tw-text-gray-700">
                  <span class="tw-inline-flex tw-items-center tw-gap-1.5">
                    <svg v-if="item.email" class="tw-w-3.5 tw-h-3.5 tw-text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {{ item.email || '-' }}
                  </span>
                </td>
                <td class="tw-px-5 tw-py-4">
                  <span :class="item.is_active ? 'tw-bg-emerald-50 tw-text-emerald-700' : 'tw-bg-slate-100 tw-text-slate-500'" class="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
                    <span class="tw-w-1.5 tw-h-1.5 tw-rounded-full tw-flex-shrink-0" :class="item.is_active ? 'tw-bg-emerald-500' : 'tw-bg-slate-400'"></span>
                    {{ item.is_active ? 'ใช้งาน' : 'ปิดใช้งาน' }}
                  </span>
                </td>
                <td class="tw-px-5 tw-py-4 tw-text-right">
                  <div class="tw-flex tw-justify-end tw-gap-2">
                    <button
                      @click="openEdit(item)"
                      :disabled="hydrated && isSelf(item)"
                      class="tw-inline-flex tw-items-center tw-gap-1.5 tw-bg-white hover:tw-bg-blue-50 disabled:tw-bg-transparent tw-text-blue-600 tw-border tw-border-blue-200 disabled:tw-border-transparent disabled:tw-text-slate-300 disabled:tw-cursor-not-allowed tw-px-2.5 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                    >
                      <svg class="tw-w-3.5 tw-h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      แก้ไข
                    </button>
                    <button
                      v-if="!isSelf(item)"
                      @click="askDelete(item)"
                      :disabled="deletingId === item.user_id"
                      class="tw-inline-flex tw-items-center tw-gap-1.5 tw-bg-white hover:tw-bg-red-50 disabled:tw-bg-transparent tw-text-red-600 tw-border tw-border-red-200 disabled:tw-border-transparent disabled:tw-text-slate-300 tw-px-2.5 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium tw-transition-colors"
                    >
                      <svg class="tw-w-3.5 tw-h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {{ deletingId === item.user_id ? 'กำลังลบ...' : 'ลบ' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="tw-px-6 tw-py-3 tw-bg-slate-50 tw-border-t tw-border-slate-200 tw-text-sm tw-text-gray-500 tw-flex tw-justify-between tw-flex-wrap tw-gap-2">
          <span>แสดง {{ filteredStaff.length }} / {{ staffList.length }} รายการ{{ searchQuery || roleFilter !== 'All' ? ' (ผลการค้นหา)' : '' }}</span>
          <span class="tw-text-slate-400 tw-text-xs">ไม่สามารถแก้ไข/ลบบัญชีของตัวเองได้</span>
        </div>
      </div>
    </div>

    <!-- ======= Create / Edit Modal ======= -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showForm" class="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-p-4">
          <div class="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-sm" @click="closeForm"></div>
          <div class="tw-relative tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-lg tw-overflow-hidden tw-transition-all tw-my-8">
            <div class="tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-px-6 tw-py-4 tw-flex tw-items-center tw-justify-between">
              <div class="tw-flex tw-items-center tw-gap-3">
                <div class="tw-w-9 tw-h-9 tw-rounded-full tw-bg-white/20 tw-flex tw-items-center tw-justify-center tw-text-white">
                  <svg class="tw-w-5 tw-h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h2 class="tw-text-lg tw-font-bold tw-text-white">{{ editingId ? 'แก้ไขเจ้าหน้าที่' : 'เพิ่มเจ้าหน้าที่' }}</h2>
                  <p class="tw-text-xs tw-text-white/80">{{ editingId ? 'ปรับข้อมูลบัญชีเจ้าหน้าที่' : 'สร้างบัญชีใหม่สำหรับเจ้าหน้าที่' }}</p>
                </div>
              </div>
              <button @click="closeForm" class="tw-text-white/80 hover:tw-text-white tw-transition-colors tw-text-2xl tw-leading-none tw-font-light">✕</button>
            </div>

            <div class="tw-px-6 tw-py-5 tw-space-y-4 tw-max-h-[70vh] tw-overflow-y-auto">
              <div v-if="formError" class="tw-bg-red-50 tw-border tw-border-red-200 tw-text-red-600 tw-text-sm tw-p-3 tw-rounded-lg">{{ formError }}</div>

              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">ชื่อ-นามสกุล <span class="tw-text-red-500">*</span></label>
                <input v-model="form.full_name" type="text" maxlength="100" placeholder="ชื่อ-นามสกุล (ตรงกับชื่อที่ใช้ login ต้องไม่ซ้ำกับตำแหน่งนี้)"
                  class="tw-w-full tw-border tw-border-gray-300 tw-p-3 tw-rounded-xl tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400"
                  @input="form.full_name = collapseSpaces(form.full_name)" />
              </div>

              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">บทบาท <span class="tw-text-red-500">*</span></label>
                <select v-model="form.role"
                  :class="inputClass(fieldErrors.role)">
                  <option v-for="r in staffRoles" :key="r" :value="r">{{ roleLabel(r) }}</option>
                </select>
                <p v-if="fieldErrors.role" class="tw-text-xs tw-text-red-500 tw-mt-1">{{ fieldErrors.role }}</p>
              </div>

              <div class="tw-grid tw-grid-cols-2 tw-gap-4">
                <div>
                  <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">เบอร์โทร</label>
                  <input
                    v-model="form.phone_number"
                    type="tel"
                    maxlength="10"
                    inputmode="numeric"
                    placeholder="เช่น 0909009090"
                    :class="inputClass(fieldErrors.phone_number)"
                    @input="clearFieldError('phone_number')"
                  />
                  <p v-if="fieldErrors.phone_number" class="tw-text-xs tw-text-red-500 tw-mt-1">{{ fieldErrors.phone_number }}</p>
                </div>
                <div>
                  <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
                    อีเมล <span v-if="!editingId" class="tw-text-red-500">*</span>
                  </label>
                  <input
                    v-model="form.email"
                    type="email"
                    maxlength="255"
                    placeholder="example@mail.com"
                    :class="inputClass(fieldErrors.email)"
                    @input="clearFieldError('email')"
                  />
                  <p v-if="fieldErrors.email" class="tw-text-xs tw-text-red-500 tw-mt-1">{{ fieldErrors.email }}</p>
                </div>
              </div>

              <div>
                <label class="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1.5">
                  รหัสผ่าน <span v-if="!editingId" class="tw-text-red-500">*</span>
                  <span v-if="editingId" class="tw-text-xs tw-text-slate-400">(เว้นว่าง = ไม่เปลี่ยน)</span>
                </label>
                <div class="tw-relative">
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    minlength="6"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    :class="[...inputClass(fieldErrors.password), 'tw-pr-10']"
                    @input="clearFieldError('password')"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="tw-absolute tw-right-3 tw-top-1/2 tw--translate-y-1/2 tw-text-slate-400 hover:tw-text-slate-600 tw-transition-colors"
                  >
                    <svg v-if="showPassword" class="tw-w-5 tw-h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                    <svg v-else class="tw-w-5 tw-h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                <p v-if="fieldErrors.password" class="tw-text-xs tw-text-red-500 tw-mt-1">{{ fieldErrors.password }}</p>
              </div>

              <div class="tw-flex tw-items-center tw-gap-3 tw-bg-slate-50 tw-border tw-border-slate-100 tw-rounded-xl tw-px-4 tw-py-3">
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
                class="tw-bg-emerald-600 hover:tw-bg-emerald-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm tw-inline-flex tw-items-center tw-gap-2">
                <svg v-if="saving" class="tw-w-4 tw-h-4 tw-border-2 tw-border-white/60 tw-border-t-transparent tw-rounded-full tw-animate-spin" viewBox="0 0 24 24"></svg>
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
              <div class="tw-w-14 tw-h-14 tw-rounded-full tw-bg-red-100 tw-flex tw-items-center tw-justify-center tw-mx-auto tw-mb-3">
                <svg class="tw-w-7 tw-h-7 tw-text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
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
                class="tw-bg-red-600 hover:tw-bg-red-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2 tw-px-5 tw-rounded-lg tw-text-sm tw-transition-colors tw-shadow-sm tw-inline-flex tw-items-center tw-gap-2">
                <svg v-if="deletingId !== null" class="tw-w-4 tw-h-4 tw-border-2 tw-border-white/60 tw-border-t-transparent tw-rounded-full tw-animate-spin" viewBox="0 0 24 24"></svg>
                {{ deletingId !== null ? 'กำลังลบ...' : 'ยืนยันลบ' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ======= Toast ======= -->
    <Teleport to="body">
      <div class="tw-fixed tw-top-4 tw-right-4 tw-z-[60] tw-space-y-2">
        <TransitionGroup name="toast">
          <div
            v-for="t in toasts"
            :key="t.id"
            :class="t.type === 'success' ? 'tw-bg-emerald-600' : 'tw-bg-red-600'"
            class="tw-text-white tw-px-4 tw-py-3 tw-rounded-xl tw-shadow-lg tw-text-sm tw-font-medium tw-flex tw-items-center tw-gap-2 tw-max-w-sm"
          >
            <svg v-if="t.type === 'success'" class="tw-w-4 tw-h-4 tw-flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="tw-w-4 tw-h-4 tw-flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {{ t.message }}
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ROLE_LABELS } from '~/constants/roles'
import { collapseSpaces } from '~/utils/name'

// ============================================================
// Composables
// ============================================================

const { session, refresh } = useSession()

// ============================================================
// State
// ============================================================

const staffRoles = ['Admin', 'Clinic_staff', 'Security_guard']

const roleFilters = [
  { value: 'All', label: 'ทั้งหมด' },
  { value: 'Admin', label: 'แอดมิน' },
  { value: 'Clinic_staff', label: 'เจ้าหน้าที่คลินิก' },
  { value: 'Security_guard', label: 'รปภ.' },
]

const staffList = ref([])
const loading = ref(false)
const errorMsg = ref('')
const hydrated = ref(false)

const searchQuery = ref('')
const roleFilter = ref('All')

const showForm = ref(false)
const showDeleteModal = ref(false)
const editingId = ref(null)
const saving = ref(false)
const deletingId = ref(null)
const formError = ref('')
const itemToDelete = ref(null)
const showPassword = ref(false)

const toasts = ref([])
let toastSeq = 0

const emptyForm = () => ({
  full_name: '',
  role: 'Clinic_staff',
  phone_number: '',
  email: '',
  password: '',
  is_active: true,
})

const form = reactive(emptyForm())

const fieldErrors = reactive({
  full_name: '',
  role: '',
  phone_number: '',
  email: '',
  password: '',
})

// ============================================================
// Derived
// ============================================================

const stats = computed(() => {
  const total = staffList.value.length
  const active = staffList.value.filter(s => s.is_active).length
  return { total, active, inactive: total - active }
})

const filteredStaff = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return staffList.value.filter(item => {
    if (roleFilter.value !== 'All' && item.role !== roleFilter.value) return false
    if (!q) return true
    return (
      (item.full_name || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.phone_number || '').toLowerCase().includes(q)
    )
  })
})

// ============================================================
// Helpers
// ============================================================

function roleLabel(role) {
  return ROLE_LABELS[role] || role
}

function roleBadgeClass(role) {
  const map = {
    Admin: 'tw-bg-orange-100 tw-text-orange-700',
    Clinic_staff: 'tw-bg-emerald-100 tw-text-emerald-700',
    Security_guard: 'tw-bg-blue-100 tw-text-blue-700',
  }
  return map[role] || 'tw-bg-slate-100 tw-text-slate-700'
}

function roleAvatarClass(role) {
  const map = {
    Admin: 'tw-bg-gradient-to-br tw-from-orange-400 tw-to-red-500',
    Clinic_staff: 'tw-bg-gradient-to-br tw-from-emerald-400 tw-to-green-500',
    Security_guard: 'tw-bg-gradient-to-br tw-from-blue-400 tw-to-indigo-500',
  }
  return map[role] || 'tw-bg-slate-400'
}

function inputClass(hasError) {
  return [
    'tw-w-full tw-border tw-p-3 tw-rounded-xl tw-outline-none tw-transition-colors',
    hasError
      ? 'tw-border-red-400 focus:tw-ring-2 focus:tw-ring-red-300'
      : 'tw-border-gray-300 focus:tw-ring-2 focus:tw-ring-emerald-400',
  ]
}

// บัญชีของตัวเอง = ชื่อ+บทบาทตรงกับ session (กันแก้ไข/ลบตัวเอง)
function isSelf(item) {
  const s = session.value
  if (!s) return false
  return item.full_name === s.full_name && item.role === s.role
}

function showToast(message, type = 'success') {
  const id = ++toastSeq
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

function resetFilters() {
  searchQuery.value = ''
  roleFilter.value = 'All'
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
// Validation
// ============================================================

const clearFieldError = (field) => {
  fieldErrors[field] = ''
  if (formError.value) formError.value = ''
}

const validateForm = () => {
  let ok = true

  fieldErrors.full_name = ''
  if (!form.full_name.trim()) {
    fieldErrors.full_name = 'กรุณากรอกชื่อ-นามสกุล'
    ok = false
  }

  fieldErrors.role = ''
  if (!staffRoles.includes(form.role)) {
    fieldErrors.role = 'กรุณาเลือกบทบาท'
    ok = false
  }

  const phone = form.phone_number.trim()
  fieldErrors.phone_number = ''
  if (phone && !/^\d{9,10}$/.test(phone)) {
    fieldErrors.phone_number = 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก'
    ok = false
  }

  const email = form.email.trim()
  fieldErrors.email = ''
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    ok = false
  }
  if (!editingId.value && !email) {
    fieldErrors.email = 'จำเป็นต้องมีอีเมล (ใช้เป็นบัญชีในระบบ)'
    ok = false
  }

  fieldErrors.password = ''
  if (form.password && form.password.length < 6) {
    fieldErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    ok = false
  }
  if (!editingId.value && !form.password) {
    fieldErrors.password = 'ต้องกรอกรหัสผ่านเมื่อเพิ่มเจ้าหน้าที่ใหม่'
    ok = false
  }

  return ok
}

// ============================================================
// Create / Edit Modal
// ============================================================

const openCreate = () => {
  Object.assign(form, emptyForm())
  Object.keys(fieldErrors).forEach(k => (fieldErrors[k] = ''))
  showPassword.value = false
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
  Object.keys(fieldErrors).forEach(k => (fieldErrors[k] = ''))
  showPassword.value = false
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
  if (!validateForm()) return

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
    showToast(editingId.value ? 'บันทึกการแก้ไขเรียบร้อยแล้ว' : 'เพิ่มเจ้าหน้าที่เรียบร้อยแล้ว')
  } catch (error) {
    formError.value = error?.data?.statusMessage || error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่'
    showToast(formError.value, 'error')
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
    showToast('ลบเจ้าหน้าที่เรียบร้อยแล้ว')
  } catch (error) {
    const msg = error?.data?.statusMessage || error?.message || 'ไม่ทราบสาเหตุ'
    showToast('เกิดข้อผิดพลาดในการลบ: ' + msg, 'error')
    console.error('Delete staff error:', error)
  } finally {
    deletingId.value = null
  }
}

// ============================================================
// Lifecycle
// ============================================================

onMounted(async () => {
  hydrated.value = true
  await refresh()
  if (session.value?.role !== 'Admin') {
    navigateTo('/appointments')
    return
  }
  fetchStaff()
})
</script>
