<script setup lang="ts">
import {type MenuOption, NIcon} from "naive-ui";
import {type Component, h, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useUserStore} from "@/stores/user.ts";

const {t} = useI18n();
const userStore = useUserStore();

const emit = defineEmits<{
  closedrawerrequest: []
}>();

import {
  PersonOutline as PersonIcon
} from '@vicons/ionicons5'

import {
  ApartmentOutlined as DepartmentIcon,
}
  from '@vicons/antd'

import
{
  PeopleCommunity20Regular as GroupIcon,
  SlideSearch24Regular as JournalIcon,
  Settings20Regular as SettingsIcon,
  Building20Regular as siteIcon,
  PersonAccounts24Regular as RoleIcon
} from '@vicons/fluent'
import {RouterLink, useRouter} from "vue-router";
import type {
  DataTableQueryParams,
  DataTableQueryResult
} from "@/components/ui/datatable/AppDataTableTypes.ts";


interface MenuItem {
  key: string;
  icon: Component;
}

function renderIcon(icon: Component) {
  return () => h(NIcon, null, {default: () => h(icon)})
}

function renderList(root: MenuOption[], key: string, items: MenuItem[]) {
  const list: MenuOption[] = []
  for (const item of items) {
    renderMenuItem(list, item)
  }
  if (list.length > 0) {
    root.push({
      label: t('adminmenu.' + key),
      type: 'group',
      key: key,
      children: list
    })
  }
}

function renderMenuItem(list: MenuOption[], item: MenuItem) {
  if (userStore.hasPermission('read-' + item.key)) {
    list.push({
      label: () =>
        h(
          RouterLink,
          {
            to: {
              name: 'admin-' + item.key,
            }
          },
          {default: () => t('adminmenu.' + item.key)}
        ),
      key: item.key,
      icon: renderIcon(item.icon)
    })
  }
}

const menuOptions: MenuOption[] = []
const selectedKeyRef = ref('')

renderList(menuOptions, 'usersandgroups', [
  {key: 'users', icon: PersonIcon},
  {key: 'groups', icon: GroupIcon},
  {key: 'roles', icon: RoleIcon}
])

renderList(menuOptions, 'sitesanddepartments', [
  {key: 'sites', icon: siteIcon},
  {key: 'departments', icon: DepartmentIcon}
])

renderList(menuOptions, 'observability', [
  {key: 'logging', icon: JournalIcon}
])
renderList(menuOptions, 'settings', [
  {key: 'configuration', icon: SettingsIcon}
])

onMounted(() => {
  const router = useRouter();
  const route = router.currentRoute.value;
  selectedKeyRef.value = route.path.replace('/admin/','')
})
function handleUpdateValue() {
  emit('closedrawerrequest');
}
</script>

<template>
  <n-menu v-model:value="selectedKeyRef" :options="menuOptions" @update:value="handleUpdateValue"/>
</template>

<style scoped>


</style>
