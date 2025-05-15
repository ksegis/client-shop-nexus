
import React from "react";
import { cn } from "@/lib/utils";
import { SidebarItemType } from "./types";

export interface SidebarItemProps {
  isActive?: boolean;
  isCollapsed?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  id?: string;
  title?: string;
  disabled?: boolean;
  href?: string;
  external?: boolean;
  item: SidebarItemType;
}

export function SidebarItem({
  isActive,
  isCollapsed,
  icon,
  onClick,
  item,
}: SidebarItemProps) {
  const Component = item.href ? 'a' : 'button';

  return (
    <div className="px-2">
      <Component
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
          isActive && "bg-accent text-accent-foreground",
          (item.disabled as boolean) && "pointer-events-none opacity-50",
          isCollapsed && "justify-center"
        )}
        onClick={onClick}
        role={!item.href ? "button" : undefined}
        {...(item.href
          ? {
              href: item.href,
              target: item.external ? "_blank" : undefined,
              rel: item.external ? "noreferrer" : undefined,
            }
          : {})}
      >
        {icon}
        {!isCollapsed && <span>{item.title}</span>}
        {!isCollapsed && item?.labels?.new && (
          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {item.labels.new}
          </span>
        )}
      </Component>
    </div>
  );
}
