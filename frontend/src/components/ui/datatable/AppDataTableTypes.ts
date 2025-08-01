import type { DataTableColumn } from 'naive-ui'

/**
 * Paramètres de requête pour AppDataTable
 */
export interface DataTableQueryParams {
  page: number
  pageSize: number
  order: false | 'ascend' | 'descend'
  filters: Record<string, unknown>
}

/**
 * Résultat de requête pour AppDataTable
 */
export interface DataTableQueryResult<T = any> {
  pageCount: number
  data: T[]
  total: number
}

/**
 * Fonction de requête pour AppDataTable
 */
export type DataTableQueryFunction<T = any> = (
  params: DataTableQueryParams
) => Promise<DataTableQueryResult<T>>

/**
 * Props pour AppDataTable
 */
export interface AppDataTableProps<T = any> {
  columns: DataTableColumn[]
  queryFunction: DataTableQueryFunction<T>
  rowKey?: string | ((row: T) => string | number)
  pageSize?: number
}
