<template>
    <div class="tw-flex tw-items-center tw-gap-2 tw-p-10 tw-justify-center">
      <input v-model="search" type="text" placeholder="Search"
        class="tw-border tw-border-[#262626] tw-rounded-md tw-h-[42px] tw-w-5/12 tw-px-5">
      <div class=" tw-flex tw-justify-center"><common_btn text="Search" @click="Search"/></div>
     <div class=" tw-flex tw-justify-center"><common_btn text="Clear" @click="Clear"/></div>
    </div>
</template>

<script setup>
import Common_btn from './common_btn.vue'
import { ref } from 'vue'

const search = ref('')

// กำหนด emits สำหรับเหตุการณ์ที่จะส่งออกไป
const emit = defineEmits(['search', 'clear'])

const handleSearch = () => {
  emit('search', search.value)
}

const handleClear = () => {
  search.value = '' // ล้างค่าในช่องค้นหา
  emit('clear') // แจ้งคอมโพเนนต์แม่ว่าให้ล้างผลการค้นหา
}
</script>