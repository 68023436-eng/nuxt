<template>
    <navbar />
    <div class=" tw-pt-40 tw-bg-gray-100 tw-h-screen">
        <div class=" tw-font-bold tw-text-8xl tw-mb-10 tw-text-neutral-600 tw-flex tw-justify-center">
            Hello !!!
        </div>
        <div class=" tw-font-bold tw-text-2xl tw-mb-5 tw-text-neutral-600 tw-flex tw-justify-center">
            Name: {{ name }}
        </div>
        <div class=" tw-font-bold tw-text-xl tw-flex tw-justify-center">
            Age: {{ age }} years old
        </div>
        <div class=" tw-flex tw-gap-2 tw-justify-center tw-m-10 ">
        </div>
    </div>
</template>


<script setup lang="ts">
    const name = ref <String>("Yonlawat Somjai")
    const age = ref <Number>(19)
</script>