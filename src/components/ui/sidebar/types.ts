
import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface NavigationGroup {
  [key: string]: NavigationItem[];
}

export interface SidebarSection {
  title?: string;
  items: SidebarItemType[];
}

export interface SidebarItemType {
  id: string;
  title: string;
  icon?: any;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  external?: boolean;
  labels?: Record<string, string>;
  roles?: string[];
}
