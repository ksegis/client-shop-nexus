
import React, { useContext, createContext, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarItem } from "./sidebar-item";
import { SidebarSection, SidebarItemType } from "./types";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// Context for sidebar state
type SidebarContextType = {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProps {
  sections: SidebarSection[];
  collapsed?: boolean;
  className?: string;
  icon?: React.ReactNode;
  onItemClick?: (item: SidebarItemType) => void;
  footer?: React.ReactNode;
  defaultCollapsed?: boolean;
  activeItemId?: string;
  showToggle?: boolean;
  role?: "admin" | "staff" | "customer";
}

export function Sidebar({
  sections,
  className,
  icon,
  onItemClick,
  footer,
  defaultCollapsed = false,
  activeItemId,
  showToggle = true,
  role = "staff",
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles) return true;
        
        if (role === "admin") return true;
        
        return item.roles.includes(role);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <aside
        data-collapsed={isCollapsed}
        className={cn(
          "group flex flex-col gap-4 border-r border-border px-2 pt-2 pb-4 transition-all duration-200 ease-in-out data-[collapsed=true]:px-2",
          className
        )}
      >
        {showToggle && (
          <div className="flex h-12 w-full items-center justify-end px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-auto py-2">
          <nav className="grid gap-2 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-0">
            {filteredSections.map((section, index) => {
              return (
                <div key={index} className="grid gap-1">
                  {section.title && !isCollapsed && (
                    <h3 className="mb-1 text-xs uppercase text-muted-foreground pl-4">
                      {section.title}
                    </h3>
                  )}
                  {section.items.map((item) => {
                    const isActive = activeItemId === item.id;
                    return (
                      <SidebarItem
                        key={item.id}
                        item={item}
                        isActive={isActive}
                        isCollapsed={isCollapsed}
                        icon={item.icon ?? icon}
                        onClick={() => onItemClick?.(item)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
        {footer && <div className="mt-auto">{footer}</div>}
      </aside>
    </SidebarContext.Provider>
  );
}
