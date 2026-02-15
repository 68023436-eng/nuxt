<template>
    <navbar />
    <div class="tw-bg-gray-50 tw-pb-10">
        <div class=" tw-text-8xl tw-mt-10 tw-font-bold tw-flex tw-justify-center">User Page</div>

        <div class=" tw-flex tw-gap-2 tw-justify-center tw-m-10 ">
        </div>
        <div class=" tw-flex tw-justify-center"><common_btn text="Get User List" @click="getUserList "/></div>
        <div class=" tw-grid tw-grid-cols-3 tw-gap-4 tw-px-20 tw-pt-10">
            <div v-for="item in users" :key="item.id">
                <div class=" tw-bg-[#E2E8CE] tw-h-tw-flex tw-items-center tw-justify-center tw-rounded-xl tw-shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] tw-p-4 tw-border-2 tw-border-[#ACBFA4]">
                    <div class=" tw-ml-2"><div class=" tw-font-extrabold tw-text-2xl tw-font-mono">Name:</div> -{{ item.name }}</div>
                    <div class=" tw-ml-2"><div class=" tw-font-extrabold tw-text-2xl tw-font-mono">Email:</div> -{{ item.email }}</div>
                    <div class=" tw-ml-2"><div class=" tw-font-extrabold tw-text-2xl tw-font-mono">Suite:</div> -{{ item.address.suite }}</div>
                    <div class=" tw-ml-2"><div class=" tw-font-extrabold tw-text-2xl tw-font-mono">Street:</div> -{{ item.address.street }}</div>
                    <div class=" tw-ml-2"><div class=" tw-font-extrabold tw-text-2xl tw-font-mono">City:</div> -{{ item.address.city }}</div>
                    <div class=" tw-ml-2"><div class=" tw-font-extrabold tw-text-2xl tw-font-mono">Zipcode:</div> -{{ item.address.zipcode }}</div>
                </div>
            </div>
        </div>
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
        // console.log(response.data);
        users.value = response.data;
       }catch(error){
        console.error('Error fetching user data:', error);
       }
    }
</script>