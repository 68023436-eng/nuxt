<template>
    <button class=" tw-flex tw-bg-[#ACBFA4] tw-text-xl tw-font-bold tw-gap-2 tw-p-5 tw-rounded-xl">{{ props.text }} <img src="/public/icons/right-arrow-svgrepo-com.svg" alt="" class=" tw-w-7 tw-h-7"></button>
</template>

<script lang="ts" setup>
    const props = defineProps({
        text: {
            type: String,
            default: 'Next Page'
        }
    });
</script>