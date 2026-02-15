<template>
    <button :class="[colorClass, 'tw-w-30 tw-p-2 tw-rounded-xl tw-text-[#262626] tw-cursor-pointer hover:tw-bg-amber-500']">{{ props.text }}</button>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps({
    text: {
        type: String,
        default: 'Sign up'
    },
    colors: {
        type: String,
        default: 'amber'
    }
});

const colorClass = computed(() => {
    const colorMap: { [key: string]: string } = {
        amber: 'tw-bg-[#FF7F11]',
        blue: 'tw-bg-[#ACBFA4]',
    };
    return colorMap[props.colors] || 'tw-bg-amber-600';
});
</script>