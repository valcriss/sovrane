<template>
  <div>
    <h2>Exemple d'utilisation de AppDataTable</h2>
    <AppDataTable
      :columns="columns"
      :query-function="queryFunction"
      :row-key="(row) => row.id"
      :page-size="10"
    />
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumn } from 'naive-ui'
import AppDataTable from './AppDataTable.vue'
import type {
  DataTableQueryParams,
  DataTableQueryResult
} from './AppDataTableTypes'

interface ExampleData {
  id: number
  name: string
  age: number
  status: string
}

// Configuration des colonnes
const columns: DataTableColumn[] = [
  {
    title: 'ID',
    key: 'id',
    sorter: true,
    width: 100
  },
  {
    title: 'Nom',
    key: 'name',
    sorter: true,
    filter: true,
    filterOptions: [
      { label: 'Contient "John"', value: 'john' },
      { label: 'Contient "Jane"', value: 'jane' }
    ]
  },
  {
    title: 'Âge',
    key: 'age',
    sorter: true
  },
  {
    title: 'Statut',
    key: 'status',
    filter: true,
    filterOptions: [
      { label: 'Actif', value: 'active' },
      { label: 'Inactif', value: 'inactive' }
    ]
  }
]

// Données d'exemple
const mockData: ExampleData[] = Array.from({ length: 150 }, (_, index) => ({
  id: index + 1,
  name: `User ${index + 1}`,
  age: 20 + (index % 50),
  status: index % 2 === 0 ? 'active' : 'inactive'
}))

// Fonction de requête personnalisée
async function queryFunction(params: DataTableQueryParams): Promise<DataTableQueryResult<ExampleData>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredData = [...mockData]

      // Appliquer les filtres
      if (params.filters.name) {
        const nameFilter = params.filters.name as string
        filteredData = filteredData.filter(item =>
          item.name.toLowerCase().includes(nameFilter)
        )
      }

      if (params.filters.status) {
        const statusFilter = params.filters.status as string[]
        if (statusFilter.length > 0) {
          filteredData = filteredData.filter(item =>
            statusFilter.includes(item.status)
          )
        }
      }

      // Appliquer le tri
      if (params.order !== false) {
        filteredData.sort((a, b) => {
          const aVal = a.id
          const bVal = b.id

          if (params.order === 'ascend') {
            return aVal - bVal
          } else {
            return bVal - aVal
          }
        })
      }

      // Pagination
      const start = (params.page - 1) * params.pageSize
      const end = start + params.pageSize
      const pagedData = filteredData.slice(start, end)

      const result: DataTableQueryResult<ExampleData> = {
        data: pagedData,
        total: filteredData.length,
        pageCount: Math.ceil(filteredData.length / params.pageSize)
      }

      resolve(result)
    }, 500) // Simule une latence réseau
  })
}
</script>
