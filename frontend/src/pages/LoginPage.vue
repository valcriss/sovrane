<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from 'vue-i18n';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (e: unknown) {
    const err = e as { response?: { data?: { error?: string } } };
    error.value = err.response?.data?.error || t('login.error');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-100">
    <n-card class="w-full max-w-md" :title="t('login.title')">
      <form @submit.prevent="submit" class="space-y-4">
        <n-form-item>
          <n-input v-model="email" type="email" :placeholder="t('login.username')" />
        </n-form-item>
        <n-form-item>
          <n-input v-model="password" type="password" :placeholder="t('login.password')" />
        </n-form-item>
        <n-alert v-if="error" type="error">{{ error }}</n-alert>
        <div class="text-right">
          <n-button type="primary" attr-type="submit" :loading="loading">{{ t('login.submit') }}</n-button>
        </div>
      </form>
    </n-card>
  </div>
</template>

<style scoped></style>
