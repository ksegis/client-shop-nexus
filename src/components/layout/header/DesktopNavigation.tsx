import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface NavigationLink {
  name: string;
  path: string;
  icon?: string;
  children?: NavigationLink[];
  badge?: string | number;
}

interface DesktopNavigationProps {
  links: NavigationLink[];
  currentPath: string;
}

// Helper function to get Lucide icon component
const getIcon = (iconName?: string) => {
  if (!iconName) return null;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
};

export const DesktopNavigation = ({ links, currentPath }: DesktopNavigationProps) => {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="space-x-1">
        {links.map((link) => {
          const isActive = currentPath === link.path || 
            (link.children && link.children.some(child => currentPath === child.path));
          
          // If link has children, render a dropdown
          if (link.children && link.children.length > 0) {
            return (
              <NavigationMenuItem key={link.name} className="relative">
                <NavigationMenuTrigger 
                  className={cn(
                    "bg-transparent hover:bg-purple-600 hover:text-white transition-colors duration-200 text-white border-none",
                    isActive ? "bg-purple-600 text-white" : "text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(link.icon)}
                    <span className="font-medium">{link.name}</span>
                    {link.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {link.badge}
                      </span>
                    )}
                  </div>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="absolute top-full left-0 min-w-[240px] bg-white border shadow-lg rounded-md z-50">
                  <ul className="grid w-full gap-1 p-2 md:w-[240px] lg:w-[260px]">
                    {link.children.map((child) => (
                      <li key={child.name}>
                        <Link 
                          to={child.path}
                          className={cn(
                            "flex select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-200",
                            "hover:bg-blue-50 hover:text-blue-600 focus:bg-blue-50 focus:text-blue-600",
                            currentPath === child.path ? "bg-blue-100 text-blue-700" : "text-gray-700"
                          )}
                        >
                          {getIcon(child.icon)}
                          <span>{child.name}</span>
                          {child.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                              {child.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }
          
          // Otherwise render a simple link
          return (
            <NavigationMenuItem key={link.name}>
              <Link 
                to={link.path}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "bg-transparent hover:bg-purple-600 hover:text-white transition-colors duration-200 text-white border-none",
                  "flex items-center gap-2 px-4 py-2",
                  isActive ? "bg-purple-600 text-white" : "text-white"
                )}
              >
                {getIcon(link.icon)}
                <span className="font-medium">{link.name}</span>
                {link.badge && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};