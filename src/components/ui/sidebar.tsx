
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarItem } from "./sidebar/sidebar-item"; 
import { useAuth } from '@/contexts/auth'; 
import { 
  Shield, 
  Users, 
  BarChart, 
  Package, 
  UserPlus, 
  Settings, 
  FileText, 
  FileCheck,
  Truck,
  ShoppingCart,
  Calendar,
  Wrench
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/shop",
    icon: BarChart,
  },
  {
    title: "Service Desk",
    href: "/shop/service-desk",
    icon: Wrench,
  },
  {
    title: "Reports",
    href: "/shop/reports",
    icon: BarChart,
  },
  {
    title: "Employees",
    href: "/shop/employees",
    icon: Users,
  },
  {
    title: "Inventory",
    href: "/shop/inventory",
    icon: Package,
  },
  {
    title: "Parts Desk",
    href: "/shop/parts",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    href: "/shop/customers",
    icon: UserPlus,
  },
  {
    title: "Estimates",
    href: "/shop/estimates",
    icon: FileText,
  },
  {
    title: "Invoices",
    href: "/shop/invoices",
    icon: FileCheck,
  },
  {
    title: "Users",
    href: "/shop/users",
    icon: Shield,
    adminOnly: true
  }
];

export const Sidebar = () => {
  const { user } = useAuth();
  
  // If user is null or role is undefined, default to false
  const isAdmin = user?.app_metadata?.role === 'admin';
  const filteredNavigationItems = navigationItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="h-full border-r bg-background w-full">
        <div className="py-4">
          {filteredNavigationItems.map((item) => (
            <SidebarItem 
              key={item.href}
              href={item.href}
              title={item.title}
              icon={item.icon}
            />
          ))}
        </div>
      </div>
      
      {/* Mobile Sheet/Drawer - Only shown on mobile */}
      <Sheet>
        <SheetTrigger asChild className="absolute left-4 top-4 md:hidden">
          <Button variant="ghost" size="icon">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="pl-6 pb-4">
            <SheetTitle>Custom Truck Connections</SheetTitle>
            <SheetDescription>
              Manage your shop, view reports, and more.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {filteredNavigationItems.map((item) => (
              <SidebarItem 
                key={item.href}
                href={item.href}
                title={item.title}
                icon={item.icon}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
