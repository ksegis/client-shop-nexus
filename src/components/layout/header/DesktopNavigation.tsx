
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
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
  children?: NavigationLink[];
}

interface DesktopNavigationProps {
  links: NavigationLink[];
  currentPath: string;
}

export const DesktopNavigation = ({ links, currentPath }: DesktopNavigationProps) => {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {links.map((link) => {
          // If link has children, render a dropdown
          if (link.children && link.children.length > 0) {
            return (
              <NavigationMenuItem key={link.name}>
                <NavigationMenuTrigger className="bg-transparent hover:bg-gray-100">
                  <span className="text-gray-600 hover:text-shop-primary font-medium">
                    {link.name}
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="min-w-[200px] bg-white border shadow-lg">
                  <ul className="grid w-full gap-2 p-2 md:w-[200px] lg:w-[220px]">
                    {link.children.map((child) => (
                      <li key={child.name}>
                        <Link 
                          to={child.path}
                          className={cn(
                            "flex select-none items-center rounded-md px-3 py-2 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground hover:bg-gray-100",
                            currentPath === child.path ? "bg-accent text-accent-foreground" : ""
                          )}
                        >
                          {child.name}
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
                  "bg-transparent hover:bg-gray-100",
                  currentPath === link.path ? "text-shop-primary" : "text-gray-600"
                )}
              >
                {link.name}
              </Link>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
