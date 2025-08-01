<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { NIcon, NAvatar } from 'naive-ui'
import { BellRegular, Cog } from '@vicons/fa'
import {useUserStore} from "@/stores/user.ts";
const user = useUserStore().currentUser
defineProps<{ appName: string; avatarUrl?: string }>()

const emit = defineEmits(['open-admin-panel','open-user-panel']);
</script>

<template>
  <header class="flex items-center justify-between px-4 py-2 bg-white shadow">
    <span class="text-xl font-semibold">{{ appName }}</span>
    <div class="flex items-center space-x-4">
      <n-icon size="20" class="cursor-pointer text-gray-600 hover:text-gray-800">
        <BellRegular />
      </n-icon>
      <n-icon size="20" class="cursor-pointer text-gray-600 hover:text-gray-800" @click="emit('open-admin-panel')">
        <Cog />
      </n-icon>
      <n-avatar :title="user?.firstName +' ' + user?.lastName" round size="medium" :src="avatarUrl" fallback-src="https://icon-library.com/images/no-user-image-icon/no-user-image-icon-26.jpg" />
    </div>
  </header>
</template>

<style scoped>
</style>
