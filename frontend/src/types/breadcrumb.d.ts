import type {Component} from "vue";

export interface BreadcrumbItem {
  label: string;
  icon: Component
  href: string | null;
}
