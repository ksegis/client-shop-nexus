
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
  Calendar,
  ShoppingCart,
  Activity,
  Wrench,
  Truck
} from "lucide-react";

// Group navigation items according to route structure
const navigationGroups = {
  main: [
    {
      title: "Dashboard",
      href: "/shop",
      icon: BarChart,
    },
    {
      title: "Profile",
      href: "/shop/profile",
      icon: Settings,
    }
  ],
  customer: [
    {
      title: "Customers",
      href: "/shop/customers",
      icon: UserPlus,
    },
    {
      title: "Employees",
      href: "/shop/employees",
      icon: Users,
      adminOnly: true
    }
  ],
  workOrders: [
    {
      title: "Work Orders",
      href: "/shop/work-orders",
      icon: Wrench,
    }
  ],
  financial: [
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
      title: "Reports",
      href: "/shop/reports",
      icon: Activity,
    }
  ],
  inventory: [
    {
      title: "Parts Desk",
      href: "/shop/parts",
      icon: ShoppingCart,
    },
    {
      title: "Inventory",
      href: "/shop/inventory",
      icon: Package,
    }
  ],
  service: [
    {
      title: "Service Desk",
      href: "/shop/service-desk",
      icon: Truck,
    },
    {
      title: "Appointments",
      href: "/shop/appointments",
      icon: Calendar,
    }
  ],
  admin: [
    {
      title: "Admin",
      href: "/shop/admin",
      icon: Shield,
      adminOnly: true
    }
  ]
};

export const Sidebar = () => {
  const { user, profile } = useAuth();
  
  // Check if user is admin
  const isAdmin = profile?.role === 'admin' || profile?.role === 'test_admin';
  
  // Create a flattened array of all navigation items for simplified rendering
  const allNavigationItems = Object.values(navigationGroups).flat();
  
  // Filter admin-only items based on user role
  const filteredNavigationItems = allNavigationItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="h-full border-r bg-background w-full">
        <div className="py-4 space-y-4">
          {/* Main Group */}
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Main</h2>
            <div className="space-y-1">
              {navigationGroups.main.map((item) => (
                <SidebarItem 
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
          
          {/* Customers Group */}
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Customers</h2>
            <div className="space-y-1">
              {navigationGroups.customer
                .filter(item => !item.adminOnly || isAdmin)
                .map((item) => (
                  <SidebarItem 
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon}
                  />
              ))}
            </div>
          </div>
          
          {/* Work Orders */}
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Work Orders</h2>
            <div className="space-y-1">
              {navigationGroups.workOrders.map((item) => (
                <SidebarItem 
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
          
          {/* Financial */}
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Financial</h2>
            <div className="space-y-1">
              {navigationGroups.financial.map((item) => (
                <SidebarItem 
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
          
          {/* Inventory */}
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Inventory</h2>
            <div className="space-y-1">
              {navigationGroups.inventory.map((item) => (
                <SidebarItem 
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
          
          {/* Service */}
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Service</h2>
            <div className="space-y-1">
              {navigationGroups.service.map((item) => (
                <SidebarItem 
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
          
          {/* Admin - Only shown if user is admin */}
          {isAdmin && (
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Admin</h2>
              <div className="space-y-1">
                {navigationGroups.admin.map((item) => (
                  <SidebarItem 
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </div>
            </div>
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
        <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
          <SheetHeader className="pl-6 py-4">
            <SheetTitle>Custom Truck Connections</SheetTitle>
            <SheetDescription>
              Manage your shop, view reports, and more.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4 space-y-4">
            {/* Main Group */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Main</h2>
              <div className="space-y-1">
                {navigationGroups.main.map((item) => (
                  <SidebarItem 
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </div>
            </div>
            
            {/* Customers Group */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Customers</h2>
              <div className="space-y-1">
                {navigationGroups.customer
                  .filter(item => !item.adminOnly || isAdmin)
                  .map((item) => (
                    <SidebarItem 
                      key={item.href}
                      href={item.href}
                      title={item.title}
                      icon={item.icon}
                    />
                ))}
              </div>
            </div>
            
            {/* Additional groups - similar structure for mobile */}
            {/* Work Orders */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Work Orders</h2>
              <div className="space-y-1">
                {navigationGroups.workOrders.map((item) => (
                  <SidebarItem 
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </div>
            </div>
            
            {/* Financial */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Financial</h2>
              <div className="space-y-1">
                {navigationGroups.financial.map((item) => (
                  <SidebarItem 
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </div>
            </div>
            
            {/* Inventory */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Inventory</h2>
              <div className="space-y-1">
                {navigationGroups.inventory.map((item) => (
                  <SidebarItem 
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </div>
            </div>
            
            {/* Service */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Service</h2>
              <div className="space-y-1">
                {navigationGroups.service.map((item) => (
                  <SidebarItem 
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    icon={item.icon}
                  />
                ))}
              </div>
            </div>
            
            {/* Admin - Only shown if user is admin */}
            {isAdmin && (
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Admin</h2>
                <div className="space-y-1">
                  {navigationGroups.admin.map((item) => (
                    <SidebarItem 
                      key={item.href}
                      href={item.href}
                      title={item.title}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
