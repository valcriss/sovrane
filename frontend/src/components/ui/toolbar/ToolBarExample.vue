<template>
  <div>
    <h2>Exemple d'utilisation de ToolBar</h2>
    
    <ToolBar
      v-model:active-key="activeKey"
      :items="toolBarItems"
      @item-clicked="handleItemClicked"
    />
    
    <div style="margin-top: 20px; padding: 16px; background-color: #f5f5f5;">
      <h3>État actuel :</h3>
      <p><strong>Clé active :</strong> {{ activeKey || 'Aucune' }}</p>
      <p><strong>Dernier élément cliqué :</strong> {{ lastClickedItem || 'Aucun' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ToolBar from './ToolBar.vue'
import type { ToolBarItem, ToolBarItemClickedEvent } from './ToolBarTypes'
import {
  BookOutline as BookIcon,
  PersonOutline as PersonIcon,
  WineOutline as WineIcon,
  SettingsOutline as SettingsIcon,
  HomeOutline as HomeIcon
} from '@vicons/ionicons5'

const activeKey = ref<string | null>(null)
const lastClickedItem = ref<string | null>(null)

const toolBarItems: ToolBarItem[] = [
  {
    key: 'home',
    label: 'Accueil',
    icon: HomeIcon
  },
  {
    key: 'books',
    label: 'Livres',
    icon: BookIcon,
    children: [
      {
        key: 'fiction',
        label: 'Fiction'
      },
      {
        key: 'non-fiction',
        label: 'Non-fiction'
      },
      {
        key: 'poetry',
        label: 'Poésie'
      }
    ]
  },
  {
    key: 'users',
    label: 'Utilisateurs',
    icon: PersonIcon,
    children: [
      {
        key: 'active-users',
        label: 'Utilisateurs actifs'
      },
      {
        key: 'pending-users',
        label: 'Utilisateurs en attente'
      }
    ]
  },
  {
    key: 'beverages',
    label: 'Boissons',
    icon: WineIcon,
    disabled: true
  },
  {
    key: 'settings',
    label: 'Paramètres',
    icon: SettingsIcon
  }
]

function handleItemClicked(event: ToolBarItemClickedEvent) {
  console.log('Élément cliqué:', event)
  lastClickedItem.value = `${event.item.label} (${event.key})`
}
</script>
