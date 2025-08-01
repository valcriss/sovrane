# AppDataTable

Composant Vue réutilisable pour afficher des tableaux de données avec tri, filtrage et pagination côté serveur, basé sur `n-data-table` de Naive UI.

## Utilisation

### Import

```typescript
import AppDataTable from '@/components/ui/datatable/AppDataTable.vue'
import type { 
  DataTableQueryParams, 
  DataTableQueryResult 
} from '@/components/ui/datatable/types'
```

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `columns` | `DataTableColumn[]` | - | Configuration des colonnes (obligatoire) |
| `queryFunction` | `DataTableQueryFunction` | - | Fonction de requête asynchrone (obligatoire) |
| `rowKey` | `string \| ((row: any) => string \| number)` | `'id'` | Clé unique pour chaque ligne |
| `pageSize` | `number` | `10` | Nombre d'éléments par page |

### Interface de la fonction de requête

```typescript
interface DataTableQueryParams {
  page: number
  pageSize: number
  order: false | 'ascend' | 'descend'
  filters: Record<string, unknown>
}

interface DataTableQueryResult<T = any> {
  pageCount: number
  data: T[]
  total: number
}

type DataTableQueryFunction<T = any> = (
  params: DataTableQueryParams
) => Promise<DataTableQueryResult<T>>
```

### Exemple d'utilisation

```vue
<template>
  <AppDataTable 
    :columns="columns" 
    :query-function="queryFunction"
    :row-key="(row) => row.id"
    :page-size="15"
  />
</template>

<script setup lang="ts">
import type { DataTableColumn } from 'naive-ui'
import AppDataTable from '@/components/ui/datatable/AppDataTable.vue'
import type { 
  DataTableQueryParams, 
  DataTableQueryResult 
} from '@/components/ui/datatable/types'

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
}

// Configuration des colonnes
const columns: DataTableColumn[] = [
  {
    title: 'ID',
    key: 'id',
    sorter: true,
    width: 80
  },
  {
    title: 'Nom',
    key: 'name',
    sorter: true,
    filter: true,
    filterOptions: [
      { label: 'Contient "admin"', value: 'admin' },
      { label: 'Contient "user"', value: 'user' }
    ]
  },
  {
    title: 'Email',
    key: 'email',
    sorter: true
  },
  {
    title: 'Statut',
    key: 'status',
    filter: true,
    filterOptions: [
      { label: 'Actif', value: 'active' },
      { label: 'Inactif', value: 'inactive' }
    ],
    render: (row) => {
      return h('span', {
        style: {
          color: row.status === 'active' ? 'green' : 'red'
        }
      }, row.status)
    }
  }
]

// Fonction de requête
async function queryFunction(params: DataTableQueryParams): Promise<DataTableQueryResult<User>> {
  // Effectuer la requête à votre API
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  
  const result = await response.json()
  
  return {
    data: result.users,
    total: result.total,
    pageCount: result.pageCount
  }
}
</script>
```

## Fonctionnalités

- **Tri côté serveur** : Le composant transmet les informations de tri à votre fonction de requête
- **Filtrage côté serveur** : Les filtres configurés dans les colonnes sont transmis à votre fonction
- **Pagination côté serveur** : Gestion automatique de la pagination avec appels à votre API
- **État de chargement** : Affichage automatique d'un indicateur de chargement pendant les requêtes
- **Gestion d'erreurs** : Les erreurs de requête sont propagées naturellement via les Promises
- **TypeScript** : Support complet de TypeScript avec des types stricts

## Configuration des colonnes

Utilisez la configuration standard de Naive UI pour les colonnes. Consultez la [documentation de Naive UI DataTable](https://www.naiveui.com/en-US/os-theme/components/data-table) pour toutes les options disponibles.

### Exemples de colonnes courantes

```typescript
// Colonne avec tri
{
  title: 'Nom',
  key: 'name',
  sorter: true
}

// Colonne avec filtre
{
  title: 'Statut',
  key: 'status',
  filter: true,
  filterOptions: [
    { label: 'Actif', value: 'active' },
    { label: 'Inactif', value: 'inactive' }
  ]
}

// Colonne avec rendu personnalisé
{
  title: 'Actions',
  key: 'actions',
  render: (row) => {
    return h('button', {
      onClick: () => editUser(row.id)
    }, 'Éditer')
  }
}
```

## Notes importantes

- La fonction `queryFunction` doit toujours retourner une Promise
- Les paramètres de tri et de filtrage sont automatiquement transmis à votre fonction
- Le composant gère automatiquement l'état de chargement pendant les appels
- Assurez-vous que votre API backend peut gérer les paramètres de pagination, tri et filtrage
