<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const auth = useAuthStore();
const router = useRouter();

async function submit() {
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (e) {
    console.error(e);
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="p-4 space-y-2">
    <input v-model="email" type="email" placeholder="Email" class="border p-2" />
    <input v-model="password" type="password" placeholder="Password" class="border p-2" />
    <button type="submit" class="bg-blue-500 text-white px-4 py-2">Login</button>
  </form>
</template>

<style scoped></style>
