<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import AppHeader from "@/components/ui/header/AppHeader.vue";
const auth = useAuthStore();
</script>

<template>
  <AppHeader app-name="Sovrane" />
  <div class="p-4">
    <h1>Home page</h1>
    <button @click="auth.logout" class="bg-red-500 text-white px-4 py-2">Logout</button>
  </div>
</template>

<style scoped></style>
