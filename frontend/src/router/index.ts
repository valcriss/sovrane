import {createRouter, createWebHistory, type Router} from 'vue-router'
import HomePage from "@/pages/HomePage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';

const router:Router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomePage, meta: { requiresAuth: true } },
    { path: '/login', name:'login', component: LoginPage },
    { path: '/admin/users', name: 'admin-users', component: () => import('@/pages/admin/AdminUsersPage.vue') , meta: { requiresAuth: true }},
    { path: '/admin/groups', name: 'admin-groups', component: () => import('@/pages/admin/AdminGroupsPage.vue'), meta: { requiresAuth: true } },
    { path: '/admin/roles', name: 'admin-roles', component: () => import('@/pages/admin/AdminRolesPage.vue'), meta: { requiresAuth: true } },
    { path: '/admin/sites', name: 'admin-sites', component: () => import('@/pages/admin/AdminSitesPage.vue'), meta: { requiresAuth: true } },
    { path: '/admin/departments', name: 'admin-departments', component: () => import('@/pages/admin/AdminDepartmentsPage.vue'), meta: { requiresAuth: true } },
    { path: '/admin/logging', name: 'admin-logging', component: () => import('@/pages/admin/AdminLoggingPage.vue'), meta: { requiresAuth: true } },
    { path: '/admin/configuration', name: 'admin-configuration', component: () => import('@/pages/admin/AdminConfigurationPage.vue'), meta: { requiresAuth: true } },
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
