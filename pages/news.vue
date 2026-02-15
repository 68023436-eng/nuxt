<template>
    <navbar />
    <div class="tw-bg-gray-50 tw-pb-10">
        <div class=" tw-text-8xl tw-mt-10 tw-font-bold tw-flex tw-justify-center">News Page</div>

        <div class=" tw-grid tw-grid-cols-3 tw-gap-4 tw-px-20 tw-pt-10">
            <div v-for="item in posts" :key="item.id">
                <div class="tw-border tw-border-[#ACBFA4] tw-bg-[#E2E8CE] tw-rounded-xl tw-p-5 tw-h-full">
                    <div class="tw-text-xl tw-font-bold">{{ item.title }}</div>
                    <div class="tw-text-sm tw-pt-2">Body: {{ item.body }}</div>
                    <div class="tw-text-sm tw-pt-2">🪪ID: {{ item.id }}</div>
                    <div class="tw-text-sm tw-pt-2">👤UserID: {{ item.userId }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Post {
        id: number;
        title: string;
        body: string;
        userId: number;
    };

    import axios from 'axios';
    const posts = ref<Post[]>([]);

    onMounted(() => {
        getPostsList();
    });

    const getPostsList = async () => {
        try {
            const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
            posts.value = response.data;
            console.log(posts.value);
        } catch (error) {
            console.error('Error fetching posts data:', error);
        }
    }
</script>

<style></style>