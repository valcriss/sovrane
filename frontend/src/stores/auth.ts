import { defineStore } from 'pinia';
import { ref } from 'vue';
import AuthService from '@/services/api/auth.service';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));

  function setTokens(newToken: string, newRefresh: string) {
    token.value = newToken;
    refreshToken.value = newRefresh;
    localStorage.setItem('token', newToken);
    localStorage.setItem('refreshToken', newRefresh);
  }

  async function login(email: string, password: string) {
    const res = await AuthService.login({ email, password });
    setTokens(res.token, res.refreshToken);
  }

  async function refresh() {
    if (!refreshToken.value) throw new Error('No refresh token');
    const res = await AuthService.refresh({ refreshToken: refreshToken.value });
    setTokens(res.token, res.refreshToken);
  }

  async function logout() {
    if (refreshToken.value) {
      try {
        await AuthService.logout({ refreshToken: refreshToken.value });
      } catch {
        // ignore
      }
    }
    token.value = null;
    refreshToken.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  return { token, refreshToken, login, refresh, logout, setTokens };
});
