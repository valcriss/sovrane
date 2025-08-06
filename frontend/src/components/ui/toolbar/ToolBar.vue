<template>
  <div class="toolbar">
    <n-space>
      <template v-for="item in props.items" :key="item.key">
        <n-dropdown
          v-if="item.children && item.children.length > 0"
          :options="getDropdownOptions(item.children)"
          @select="(key: string) => handleDropdownSelect(key, item)"
        >
          <n-button
            :disabled="item.disabled"
            :type="item.type"
            @click="handleItemClick(item)"
          >
            <template #icon v-if="item.icon">
              <n-icon>
                <component :is="item.icon" />
              </n-icon>
            </template>
            {{ item.label }}
          </n-button>
        </n-dropdown>
        <n-button
          v-else
          :disabled="item.disabled"
          :type="item.type"
          @click="handleItemClick(item)"
        >
          <template #icon v-if="item.icon">
            <n-icon>
              <component :is="item.icon" />
            </n-icon>
          </template>
          {{ item.label }}
        </n-button>
      </template>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import type { DropdownOption } from 'naive-ui'
import type { ToolBarItem, ToolBarItemClickedEvent } from './ToolBarTypes'

interface Props {
  items: ToolBarItem[]
  activeKey?: string | null
}

interface Emits {
  (e: 'itemClicked', event: ToolBarItemClickedEvent): void
  (e: 'update:activeKey', key: string | null): void
}

const props = withDefaults(defineProps<Props>(), {
  activeKey: null,
  items: () => []
})

const emit = defineEmits<Emits>()

const activeKey = computed({
  get: () => props.activeKey,
  set: (value) => emit('update:activeKey', value)
})

function getDropdownOptions(children: ToolBarItem[]): DropdownOption[] {
  return children.map(child => ({
    key: child.key,
    label: child.label,
    disabled: child.disabled,
    icon: child.icon ? () => h('n-icon', null, { default: () => h(child.icon!) }) : undefined
  }))
}

function handleItemClick(item: ToolBarItem) {
  if (item.disabled) return
  
  // Si l'élément a des enfants, on ne fait rien (le dropdown s'occupera de l'interaction)
  if (item.children && item.children.length > 0) return
  
  // Mettre à jour la clé active
  activeKey.value = item.key
  
  // Émettre l'événement itemClicked
  const event: ToolBarItemClickedEvent = {
    key: item.key,
    item
  }
  emit('itemClicked', event)
}

function handleDropdownSelect(key: string, parentItem: ToolBarItem) {
  // Trouver l'élément enfant sélectionné
  const childItem = findChildItem(parentItem.children || [], key)
  if (!childItem) return
  
  // Mettre à jour la clé active
  activeKey.value = key
  
  // Émettre l'événement itemClicked pour l'élément enfant
  const event: ToolBarItemClickedEvent = {
    key,
    item: childItem
  }
  emit('itemClicked', event)
}

function findChildItem(children: ToolBarItem[], key: string): ToolBarItem | null {
  for (const child of children) {
    if (child.key === key) return child
    if (child.children) {
      const found = findChildItem(child.children, key)
      if (found) return found
    }
  }
  return null
}
</script>

<style scoped>
.toolbar {
  padding: 8px 16px;
  background-color: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
}
</style>