<script setup lang="ts">

import type {BreadcrumbItem} from "@/types/breadcrumb";
import {
  Home12Regular as HomeIcon,
  Settings32Regular as SettingsIcon,
} from '@vicons/fluent';
import router from "@/router";
import type {RouteRecord} from "vue-router";
import type {Component} from "vue";

const { path } = defineProps<{ path: string }>();

const tab: string[] = path.split("/");
const routes: RouteRecord[] = router.getRoutes();
const items: BreadcrumbItem[] = [];

items.push({label: 'home', icon: HomeIcon, href: '/'});
function getItemIcon(value: string): Component {
  switch (value) {
    case 'admin':
      return SettingsIcon;
    case 'configuration':
      return SettingsIcon;
    default:
      return SettingsIcon; // Default icon if no specific icon is found
  }
}
let currentPath = '';
for (let i = 1; i < tab.length; i++) {
  const value = tab[i];
  currentPath = currentPath + '/' + value;

  const route = routes.find(route => route.path === currentPath);
  if (route) {
    items.push({
      label: value,
      icon: getItemIcon(value),
      href: route.path,
    });
  } else {
    items.push({
      label: value,
      icon: getItemIcon(value),
      href: null,
    });
  }
}

</script>

<template>
  <div>
    <n-breadcrumb>
      <n-breadcrumb-item v-for="(item, index) in items" :key="index">
        <n-icon v-if="item.icon" :component="item.icon" />
        <RouterLink v-if="item.href" :to="item.href">&nbsp;{{
            $t('breadcrumb.' + item.label)
          }}
        </RouterLink>
        <span v-else>&nbsp;{{ $t('breadcrumb.' + item.label) }}</span>
      </n-breadcrumb-item>
    </n-breadcrumb>
  </div>
</template>

<style scoped>

</style>
