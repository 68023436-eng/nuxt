<template>
    <navbar />
    <div class=" tw-text-8xl tw-mt-10 tw-font-bold tw-flex tw-justify-center">User Page</div>

    <div class=" tw-flex tw-gap-2 tw-justify-center tw-m-10 ">
        <NuxtLink to="/About"><back_btn /></NuxtLink>
    </div>
    <common_btn text="Get User List" @click="getUserList" />
    <div class=" tw-grid tw-grid-cols-3 tw-gap-4 tw-px-20 tw-pt-10">
        <div class=" tw-bg-[#E2E8CE] tw-h-60 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] tw-font-bold tw-text-3xl">Test 1</div>
        <div class=" tw-bg-[#E2E8CE] tw-h-60 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] tw-font-bold tw-text-3xl">Test 2</div>
        <div class=" tw-bg-[#E2E8CE] tw-h-60 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] tw-font-bold tw-text-3xl">Test 3</div>
        <div class=" tw-bg-[#E2E8CE] tw-h-60 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] tw-font-bold tw-text-3xl">Test 4</div>
        <div class=" tw-bg-[#E2E8CE] tw-h-60 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] tw-font-bold tw-text-3xl">Test 5</div>
        <div class=" tw-bg-[#E2E8CE] tw-h-60 tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] tw-font-bold tw-text-3xl">Test 6</div>
    </div>
</template>

<script lang="ts" setup>
    interface User {
        id: number;
        name: string;
        email: string;
        address: {
            street: string;
            suite: string;
            city: string;
            zipcode: string;
        };
    }

    const users = ref<User[]>([]);
    import axios from 'axios';

    const getUserList = async () => {
       try{
        const response = await axios.get('https://jsonplaceholder.typicode.com/users',);
        console.log(response);
        users.value = response.data;
       }catch(error){
        console.error('Error fetching user data:', error);
       }
    }
</script>