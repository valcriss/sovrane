import type { Component } from 'vue'

/**
 * Élément de menu pour ToolBar
 */
export interface ToolBarItem {
  key: string
  label: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  icon?: Component
  disabled?: boolean
  children?: ToolBarItem[]
}

/**
 * Événement émis lors du clic sur un élément
 */
export interface ToolBarItemClickedEvent {
  key: string
  item: ToolBarItem
}

/**
 * Props pour ToolBar
 */
export interface ToolBarProps {
  items: ToolBarItem[]
  activeKey?: string | null
}
