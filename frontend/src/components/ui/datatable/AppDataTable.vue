<template>
  <n-data-table
    remote
    ref="table"
    :columns="props.columns"
    :data="data"
    :loading="loading"
    :pagination="pagination"
    :row-key="getRowKey"
    @update:sorter="handleSorterChange"
    @update:filters="handleFiltersChange"
    @update:page="handlePageChange"
  />
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { DataTableSortState, DataTableColumn } from 'naive-ui'
import type {
  DataTableQueryParams,
  DataTableQueryResult,
  DataTableQueryFunction
} from './AppDataTableTypes'

interface Props {
  columns: DataTableColumn[]
  queryFunction: DataTableQueryFunction
  rowKey?: string | ((row: any) => string | number)
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  pageSize: 10
})

const data = ref<any[]>([])
const loading = ref(true)
const pagination = reactive({
  page: 1,
  pageCount: 1,
  pageSize: props.pageSize,
  itemCount: 0,
  prefix: ({ itemCount }: { itemCount: number }) => `Total is ${itemCount}.`
})

// Internal state for tracking current sort and filter state
const currentSortState = ref<DataTableSortState | null>(null)
const currentFilters = ref<Record<string, unknown>>({})

function getRowKey(rowData: any): string | number {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(rowData)
  }
  return rowData[props.rowKey] || rowData.id || rowData.key
}

function handleSorterChange(sorter: DataTableSortState | DataTableSortState[] | null) {
  const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter
  currentSortState.value = singleSorter

  if (!loading.value) {
    loading.value = true

    const queryParams: DataTableQueryParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      order: !singleSorter ? false : singleSorter.order,
      filters: currentFilters.value
    }

    props.queryFunction(queryParams).then((result: DataTableQueryResult) => {
      data.value = result.data
      pagination.pageCount = result.pageCount
      pagination.itemCount = result.total
      loading.value = false
    })
  }
}

function handleFiltersChange(filters: Record<string, unknown>) {
  if (!loading.value) {
    loading.value = true
    currentFilters.value = filters

    const queryParams: DataTableQueryParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      order: currentSortState.value?.order || false,
      filters: filters
    }

    props.queryFunction(queryParams).then((result: DataTableQueryResult) => {
      data.value = result.data
      pagination.pageCount = result.pageCount
      pagination.itemCount = result.total
      loading.value = false
    })
  }
}

function handlePageChange(currentPage: number) {
  if (!loading.value) {
    loading.value = true

    const queryParams: DataTableQueryParams = {
      page: currentPage,
      pageSize: pagination.pageSize,
      order: currentSortState.value?.order || false,
      filters: currentFilters.value
    }

    props.queryFunction(queryParams).then((result: DataTableQueryResult) => {
      data.value = result.data
      pagination.page = currentPage
      pagination.pageCount = result.pageCount
      pagination.itemCount = result.total
      loading.value = false
    })
  }
}

onMounted(() => {
  const queryParams: DataTableQueryParams = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    order: false,
    filters: {}
  }

  props.queryFunction(queryParams).then((result: DataTableQueryResult) => {
    data.value = result.data
    pagination.pageCount = result.pageCount
    pagination.itemCount = result.total
    loading.value = false
  })
})
</script>
