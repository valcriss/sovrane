import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const auth = useAuthStore();
    if (err.response?.status === 401 && auth.refreshToken) {
      try {
        await auth.refresh();
        err.config.headers.Authorization = `Bearer ${auth.token}`;
        return client(err.config);
      } catch {
        await auth.logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
