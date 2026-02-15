<template>
    <div class=" tw-font-bold tw-text-2xl tw-mb-5 tw-text-neutral-600">
        Hi my project {{ name }}
    </div>
     <div class=" tw-font-bold tw-text-xl">
        Age: {{ age }} years old
    </div>
    <div class="title">

    </div>
</template>

<script setup lang="ts">
    const name = ref <String>("Nisarat yongyut")
    const age = ref <Number>(300)
</script>