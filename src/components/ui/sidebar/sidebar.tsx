import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetOverlay,
  SheetPortal,
  SheetClose
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarItem } from "./sidebar-item";
import { useAuth } from '@/contexts/auth'; 
import { 
  Shield, 
  Users, 
  BarChart, 
  Package, 
  ListChecks, 
  UserPlus, 
  Settings, 
  FileText, 
  FileCheck, 
  Key,
  Activity 
} from "lucide-react";

// Navigation items for the shop portal
const navigationItems = [
  {
    title: "Dashboard",
    href: "/shop",
    icon: BarChart,
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
    title: "Work Orders",
    href: "/shop/work-orders",
    icon: ListChecks,
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

// Admin-specific navigation items
const adminNavigationItems = [
  {
    title: "Admin Dashboard",
    href: "/shop/admin",
    icon: Shield,
  },
  {
    title: "API Keys",
    href: "/shop/admin/api-keys",
    icon: Key,
  },
  {
    title: "Staff Management",
    href: "/shop/admin/staff",
    icon: Users,
  },
  {
    title: "System Health",
    href: "/shop/admin/system",
    icon: Activity,
  }
];

export const Sidebar = () => {
  const { user } = useAuth();
  
  // Debug output to see if the admin check is working correctly
  const isAdmin = user?.app_metadata?.role === 'admin';
  console.log("Sidebar - isAdmin check result:", isAdmin);
  console.log("Admin navigation items:", adminNavigationItems);

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
          
          {/* Admin section if user is admin */}
          {isAdmin && (
            <>
              <div className="mx-4 my-2">
                <div className="h-px bg-border" />
                <h3 className="text-xs font-medium text-muted-foreground pt-2 pl-2">Admin</h3>
              </div>
              {adminNavigationItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                />
              ))}
            </>
          )}
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
            <SheetTitle>Acme Co.</SheetTitle>
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
            
            {/* Admin section for mobile if user is admin */}
            {isAdmin && (
              <>
                <div className="mx-4 my-2">
                  <div className="h-px bg-border" />
                  <h3 className="text-xs font-medium text-muted-foreground pt-2 pl-2">Admin</h3>
                </div>
                {adminNavigationItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
