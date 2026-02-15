<template>
    <div class=" tw-w-full tw-h-20 tw-text-[#262626] tw-font-bold tw-flex tw-px-7 tw-items-center tw-font-mono tw-justify-between tw-shadow-2xl">
        <div class=" tw-text-3xl tw-cursor-pointer">Test Vue Framework.</div>
        <div class=" tw-flex tw-items-center tw-gap-5">
            <div class=" tw-flex tw-gap-10 tw-cursor-pointer ">
                <NuxtLink to="/About">About</NuxtLink>
                <NuxtLink to="/">Home</NuxtLink>
                <div>News</div>
            </div>
            <div class=" tw-flex tw-gap-2">
                <log_btn />
                <common_btn text="Login" />
            </div>
        </div>
    </div>
</template>