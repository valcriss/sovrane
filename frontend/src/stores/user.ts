import { defineStore } from 'pinia';
import { ref } from 'vue';
import UsersService, { type User } from '@/services/api/users.service';

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null);
  const lastUserEvent = ref<{ type: string; payload?: any } | null>(null);

  type Permission = {
    permission: { permissionKey: string };
    scopeId: string | null;
  };
  async function fetchCurrent() {
    currentUser.value = await UsersService.me();
    return currentUser.value;
  }

  function hasPermission(permission: string, scopeId: string | null = null): boolean {
    const user = currentUser.value;
    if (!user) return false;

    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions && checkPermissions(permission, scopeId, role.permissions as Permission[])) return true;
      }
    }
    return !!(user.permissions && checkPermissions(permission, scopeId, user.permissions as Permission[]));
  }

  function checkPermissions(permission: string, scopeId: string | null = null, permissions: Permission[]) {
    for (const p of permissions) {
      if (p.permission.permissionKey === 'root') {
        return true;
      }
      if (p.permission.permissionKey === permission) {
        return !(p.scopeId !== null && p.scopeId !== scopeId);
      }
    }
    return false;
  }

  function clear() {
    currentUser.value = null;
  }

  function emitUserEvent(type: string, payload?: any) {
    lastUserEvent.value = { type, payload };
  }

  return { currentUser, hasPermission, fetchCurrent, clear, emitUserEvent, lastUserEvent };
});
