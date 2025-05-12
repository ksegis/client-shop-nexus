
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  href: string;
  title: string;
  icon: LucideIcon;
}

export const SidebarItem = ({ href, title, icon: Icon }: SidebarItemProps) => {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-base transition-colors hover:text-foreground',
          'mx-2 mb-1',
          isActive
            ? 'bg-accent text-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted'
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{title}</span>
    </NavLink>
  );
};
