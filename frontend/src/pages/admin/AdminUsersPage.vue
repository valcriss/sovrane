<script setup lang="ts">
import NavigationBreadcrumb from "@/components/navigation/NavigationBreadcrumb.vue";
import AppDataTable from "@/components/ui/datatable/AppDataTable.vue";
import type { DataTableColumn } from 'naive-ui'
import {useI18n} from "vue-i18n";
import {useSiteStore} from "@/stores/site.ts";
import {useDepartmentStore} from "@/stores/department.ts";
import {useUserStore} from "@/stores/user.ts";
import type {FilterOption} from "naive-ui/es/data-table/src/interface";
import usersService from '@/services/api/users.service'
import type { ListUsersParams } from '@/services/api/users.service'
import { ref, computed, onMounted } from 'vue'

const siteStore = useSiteStore();
const departmentStore = useDepartmentStore();

import type {
  DataTableQueryParams,
  DataTableQueryResult
} from '@/components/ui/datatable/AppDataTableTypes'

const departmentFilterOptions = ref<FilterOption[]>([])
const siteFilterOptions = ref<FilterOption[]>([])

onMounted(async () => {
  try {
    departmentFilterOptions.value = await departmentStore.getFilterOptions()
    siteFilterOptions.value = await siteStore.getFilterOptions()
  } catch (error) {
    console.error('Error loading filter options:', error)
  }
})

interface UserTableRecord {
  id:string
  fullName:string
  email:string
  status:string
  site:string
  department:string
  lastActivity:string
}
const {t} = useI18n();
const columns = computed<DataTableColumn[]>(() => [
  {
    title: t('users.email'),
    key: 'email',
    sorter: true,
  },
  {
    title: t('users.fullName'),
    key: 'fullName',
    sorter: true,
  },
  {
    title: t('users.status'),
    key: 'status',
    sorter: true,
    filter: true,
    filterOptions: [
      { label: t('users.active'), value: 'active' },
      { label: t('users.suspended'), value: 'suspended' },
      { label: t('users.archived'), value: 'archived' }
    ]
  },
  {
    title: t('users.site'),
    key: 'site',
    filter: true,
    filterOptions: siteFilterOptions.value
  },
  {
    title: t('users.department'),
    key: 'department',
    filter: true,
    filterOptions: departmentFilterOptions.value
  }
])

async function fetchUsers(params: ListUsersParams):Promise<DataTableQueryResult<UserTableRecord>> {
  try {
    const data = await usersService.list(params)
    const records :UserTableRecord[] = []
    for (const user of data.items) {
      records.push({
        id: user.id,
        fullName: user.firstName+ ' ' + user.lastName,
        email: user.email,
        status: user.status ?? 'active',
        site: user.site ? user.site.label : '',
        department: user.department ? user.department.label : '',
        lastActivity: user.lastActivity ? new Date(user.lastActivity).toLocaleString() : ''
      })
    }
    return {
      data: records,
      total: data.total,
      pageCount: Math.ceil(data.total / data.limit)
    }
  } catch (err) {
    console.error(err)
    return { data: [], total: 0, pageCount: 0 };
  } finally {

  }
}

async function queryFunction(queryParams: DataTableQueryParams): Promise<DataTableQueryResult<UserTableRecord>> {
  console.log('queryFunction', queryParams)
  const listParams: ListUsersParams = {
    page: queryParams.page,
    limit: queryParams.pageSize,
    siteId: undefined,
    departmentId: undefined
  }
  return await fetchUsers(listParams)
}

</script>

<template>
  <div class="p-4">
    <NavigationBreadcrumb path="/admin/users" />
    <div class="mt-2">
      <AppDataTable
        :columns="columns"
        :query-function="queryFunction"
        :row-key="(row) => row.id"
        :page-size="20"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
