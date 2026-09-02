<template>
     <Sidebar/>
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
    // ทดสอบยิงขอ Session จาก Supabase (ไม่ต้องรอสร้างตาราง)
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    isSuccess.value = true
    statusMessage.value = ' เชื่อมต่อกับ Supabase สำเร็จเรียบร้อย!'
    console.log('Supabase Data:', data)
  } catch (err) {
    isSuccess.value = false
    statusMessage.value = ` เชื่อมต่อล้มเหลว: ${err.message || err}`
    console.error('Supabase Error:', err)
  } finally {
    loading.value = false
  }
}
</script>