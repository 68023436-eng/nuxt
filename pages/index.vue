<template>
  <div class="tw-flex tw-min-h-screen tw-w-full tw-bg-slate-50">
    <Sidebar />
    <div class="tw-flex-1 tw-p-8">
      <div class="tw-bg-blue-100 tw-border-l-8 tw-border-l-blue-500 tw-p-5 tw-rounded-xl tw-shadow-sm tw-mb-8">
        <h1 class="tw-text-2xl tw-font-bold tw-text-gray-800">หน้าหลัก</h1>
        <p class="tw-text-sm tw-text-slate-500 tw-font-mono tw-mt-1">Dashboard</p>
      </div>

      <div class="tw-bg-white tw-p-6 tw-rounded-2xl tw-shadow-sm tw-border tw-border-slate-100 tw-max-w-2xl">
        <h2 class="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-4">สถานะการเชื่อมต่อ Supabase</h2>
        
        <button 
          @click="checkSupabase" 
          :disabled="loading"
          class="tw-bg-blue-600 hover:tw-bg-blue-700 disabled:tw-bg-gray-400 tw-text-white tw-font-medium tw-py-2.5 tw-px-6 tw-rounded-lg tw-shadow-sm transition"
        >
          {{ loading ? 'กำลังตรวจสอบ...' : 'ทดสอบเชื่อมต่อ Supabase' }}
        </button>

        <div v-if="statusMessage" class="tw-mt-4 tw-p-4 tw-rounded-lg" :class="isSuccess ? 'tw-bg-green-50 tw-text-green-700' : 'tw-bg-red-50 tw-text-red-700'">
          {{ statusMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '~/components/sidebar.vue'

const supabase = useSupabaseClient()
const loading = ref(false)
const statusMessage = ref('')
const isSuccess = ref(false)

const checkSupabase = async () => {
  loading.value = true
  statusMessage.value = ''

  try {
    // ทดสอบดึงข้อมูลจากตาราง appointments
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_id')
      .limit(1)

    if (error) {
      throw error
    }

    isSuccess.value = true
    statusMessage.value = `✅ เชื่อมต่อกับ Supabase สำเร็จเรียบร้อย! (พบ ${data?.length ?? 0} รายการ)`
    console.log('Supabase connection: OK')
  } catch (err) {
    isSuccess.value = false
    statusMessage.value = `❌ เชื่อมต่อล้มเหลว: ${err.message || err}`
    console.error('Supabase Error:', err)
  } finally {
    loading.value = false
  }
}
</script>