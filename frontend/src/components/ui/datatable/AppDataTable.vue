<template>
  <n-data-table
    remote
    ref="table"
    :columns="columns"
    :data="data"
    :loading="loading"
    :pagination="pagination"
    :row-key="rowKey"
    @update:sorter="handleSorterChange"
    @update:filters="handleFiltersChange"
    @update:page="handlePageChange"
  />
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { DataTableSortState } from 'naive-ui'

interface RowData {
  column1: number
  column2: number
  column3: string
}

interface QueryResult {
  pageCount: number
  data: RowData[]
  total: number
}

const column1 = reactive({
  title: 'column1',
  key: 'column1',
  sorter: true,
  sortOrder: false as false | 'ascend' | 'descend'
})

const column2 = reactive({
  title: 'column2',
  key: 'column2',
  filter: true,
  filterOptionValue: [] as number[],
  filterOptions: [
    { label: 'Value1', value: 1 },
    { label: 'Value2', value: 2 }
  ]
})

const columns = ref([
  column1,
  column2,
  { title: 'Column3', key: 'column3' }
])

const fullData = Array.from({ length: 987 }).map((_, index) => ({
  column1: index,
  column2: (index % 2) + 1,
  column3: `a${index}`
}))

function query(page: number, pageSize = 10, order: false | 'ascend' | 'descend' = 'ascend', filterValues: number[] = []): Promise<QueryResult> {
  return new Promise((resolve) => {
    const copiedData = [...fullData]
    const orderedData = order === 'descend' ? copiedData.reverse() : copiedData
    const filteredData = filterValues.length
      ? orderedData.filter(row => filterValues.includes(row.column2))
      : orderedData
    const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize)
    const total = filteredData.length
    const pageCount = Math.ceil(total / pageSize)
    setTimeout(() => resolve({ pageCount, data: pagedData, total }), 1500)
  })
}

const data = ref<RowData[]>([])
const loading = ref(true)
const pagination = reactive({
  page: 1,
  pageCount: 1,
  pageSize: 10,
  itemCount: 0,
  prefix: ({ itemCount }: { itemCount: number }) => `Total is ${itemCount}.`
})

function rowKey(rowData: RowData): number {
  return rowData.column1
}

function handleSorterChange(sorter: DataTableSortState | DataTableSortState[] | null) {
  const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter
  if (!singleSorter || singleSorter.columnKey === 'column1') {
    if (!loading.value) {
      loading.value = true
      query(
        pagination.page,
        pagination.pageSize,
        !singleSorter ? false : singleSorter.order,
        column2.filterOptionValue
      ).then((result) => {
        column1.sortOrder = !singleSorter ? false : singleSorter.order
        data.value = result.data
        pagination.pageCount = result.pageCount
        pagination.itemCount = result.total
        loading.value = false
      })
    }
  }
}

function handleFiltersChange(filters: Record<string, unknown>) {
  if (!loading.value) {
    loading.value = true
    console.log('filters', filters)
    const filterValues: number[] = filters.column2 as number[] || []
    console.log('filterValues', filterValues)
    query(
      pagination.page,
      pagination.pageSize,
      column1.sortOrder,
      filterValues
    ).then((result) => {
      column2.filterOptionValue = filterValues
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
    query(
      currentPage,
      pagination.pageSize,
      column1.sortOrder,
      column2.filterOptionValue
    ).then((result) => {
      data.value = result.data
      pagination.page = currentPage
      pagination.pageCount = result.pageCount
      pagination.itemCount = result.total
      loading.value = false
    })
  }
}

onMounted(() => {
  query(
    pagination.page,
    pagination.pageSize,
    column1.sortOrder,
    column2.filterOptionValue
  ).then((result) => {
    data.value = result.data
    pagination.pageCount = result.pageCount
    pagination.itemCount = result.total
    loading.value = false
  })
})
</script>
