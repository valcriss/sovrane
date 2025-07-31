import { createRouter, createWebHistory } from 'vue-router'
import HomePage from "@/pages/HomePage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomePage, meta: { requiresAuth: true } },
    { path: '/login', component: LoginPage },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const userStore = useUserStore();

  if (to.meta.requiresAuth) {
    if (!auth.token) return '/login';
    try {
      if (!userStore.currentUser) {
        await userStore.fetchCurrent();
      }
    } catch {
      await auth.logout();
      return '/login';
    }
  }

  if (to.path === '/login' && auth.token) return '/';
});

export default router
