
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
