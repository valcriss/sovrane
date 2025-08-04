<script setup lang="ts">
import {useUserStore} from "@/stores/user.ts";
import AppHeader from "@/components/ui/header/AppHeader.vue";
import {computed, ref} from 'vue';
import { useAuthStore } from "@/stores/auth.ts";
import { lightTheme } from 'naive-ui'

const userStore = useUserStore();
const user = computed(() => userStore.currentUser);
const drawerOpen = ref(false);
const drawerContent = ref('')
const auth = useAuthStore();

import {
  LogOutOutline as LogOutIcon,
} from '@vicons/ionicons5'
import AdminMenu from "@/components/navigation/AdminMenu.vue";

const DRAWER_ADMIN = 'drawer.admin_drawer';
function closeDrawer() {
  drawerOpen.value = false;
  drawerContent.value = '';
}
</script>

<template>
  <n-config-provider :theme="lightTheme">
    <AppHeader v-if="user != null" app-name="Sovrane"
               @open-admin-panel="() => { drawerOpen = true ; drawerContent= DRAWER_ADMIN}"/>
    <main>
      <RouterView/>
    </main>
    <n-drawer
      v-model:show="drawerOpen"
      :default-width="300"
      placement="right"
      show-mask="transparent"
      resizable
    >
      <n-drawer-content v-if="drawerContent !== ''" :title="$t(drawerContent)">
        <AdminMenu @closedrawerrequest="() => closeDrawer()" v-if="drawerContent === DRAWER_ADMIN"/>
        <template #footer>
          <n-button secondary
                    @click="drawerOpen=false; auth.logout().then(() => {  $router.push({ name: 'login' }) })">
            <n-icon>
              <LogOutIcon/>
            </n-icon>&nbsp;Déconnexion
          </n-button>
        </template>
      </n-drawer-content>
    </n-drawer>
  </n-config-provider>
</template>

<style>
@import 'tailwindcss';

.n-drawer.n-drawer--right-placement {
  top: 52px;
}

.n-menu .n-menu-item-content:not(.n-menu-item-content--disabled):not(.n-menu-item-content--selected, child-active):focus-within::before {
  background-color: transparent !important;
}
</style>
