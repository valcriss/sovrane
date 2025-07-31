import { defineStore } from 'pinia';
import { ref } from 'vue';
import UsersService, { type User } from '@/services/api/users.service';

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null);

  async function fetchCurrent() {
    currentUser.value = await UsersService.me();
    return currentUser.value;
  }

  function clear() {
    currentUser.value = null;
  }

  return { currentUser, fetchCurrent, clear };
});
