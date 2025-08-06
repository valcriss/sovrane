# ToolBar Component

Un composant de barre d'outils horizontale personnalisable pour Vue 3 avec Naive UI.

## Fonctionnalités

- Barre de boutons horizontale
- Support des icônes
- Support des menus déroulants (enfants)
- Boutons désactivables
- Gestion de l'état actif
- Événements personnalisés

## Types

Le composant utilise les types définis dans `ToolBarTypes.ts` :

- `ToolBarItem` : Structure d'un élément de menu
- `ToolBarItemClickedEvent` : Événement émis lors du clic
- `ToolBarProps` : Props du composant

## Utilisation

```vue
<template>
  <ToolBar
    v-model:active-key="activeKey"
    :items="toolBarItems"
    @item-clicked="handleItemClicked"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ToolBar from './ToolBar.vue'
import type { ToolBarItem, ToolBarItemClickedEvent } from './ToolBarTypes'
import { HomeOutline as HomeIcon } from '@vicons/ionicons5'

const activeKey = ref<string | null>(null)

const toolBarItems: ToolBarItem[] = [
  {
    key: 'home',
    label: 'Accueil',
    icon: HomeIcon
  },
  {
    key: 'settings',
    label: 'Paramètres',
    children: [
      {
        key: 'general',
        label: 'Général'
      },
      {
        key: 'advanced',
        label: 'Avancé'
      }
    ]
  }
]

function handleItemClicked(event: ToolBarItemClickedEvent) {
  console.log('Élément cliqué:', event.key, event.item)
}
</script>
```

## Props

| Prop | Type | Défaut | Description |
|------|------|---------|-------------|
| `items` | `ToolBarItem[]` | `[]` | Liste des éléments à afficher |
| `activeKey` | `string \| null` | `null` | Clé de l'élément actuellement actif |

## Events

| Event | Type | Description |
|-------|------|-------------|
| `itemClicked` | `ToolBarItemClickedEvent` | Émis lors du clic sur un élément |
| `update:activeKey` | `string \| null` | Émis pour la synchronisation v-model |

## Structure ToolBarItem

```typescript
interface ToolBarItem {
  key: string           // Identifiant unique
  label: string         // Texte affiché
  icon?: Component      // Icône (optionnel)
  disabled?: boolean    // Désactivé (optionnel)
  children?: ToolBarItem[] // Sous-éléments (optionnel)
}
```

## Exemple complet

Voir `ToolBarExample.vue` pour un exemple d'utilisation complète avec gestion des états.
