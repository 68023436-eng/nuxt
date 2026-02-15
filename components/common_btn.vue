<template>
    <button class=" tw-bg-[#2563EB] tw-text-white tw-p-2 tw-rounded-lg tw-shadow-md hover:tw-bg-[#1D4ED8]">{{ props.text }}</button>
</template>

<script lang="ts" setup>
    const props = defineProps({
        text: {
            type: String,
            default: ' ',
        }
    });
</script>