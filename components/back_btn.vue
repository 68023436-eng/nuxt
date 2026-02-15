<template>
    <button class=" tw-flex tw-bg-[#ACBFA4] tw-text-xl tw-font-bold tw-gap-2 tw-p-5 tw-rounded-xl"><img src="/public/icons/left-arrow-svgrepo-com.svg" alt="" class=" tw-w-7 tw-h-7">{{ props.text }}</button>
</template>

<script lang="ts" setup>
    const props = defineProps({
        text: {
            type: String,
            default: 'Back Page'
        }
    });
</script>