
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
import { useNavigationLinks } from '@/components/layout/header/NavigationLinks';
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
  Activity,
  Webhook
} from "lucide-react";

// Map paths to icons
const pathIconMap = {
  "/shop": BarChart,
  "/shop/reports": BarChart,
  "/shop/employees": Users,
  "/shop/inventory": Package,
  "/shop/work-orders": ListChecks,
  "/shop/customers": UserPlus,
  "/shop/estimates": FileText,
  "/shop/invoices": FileCheck,
  "/shop/users": Shield,
  "/shop/admin/api-connections": Webhook
};

export const Sidebar = () => {
  const { user } = useAuth();
  const { links, isAdmin } = useNavigationLinks('shop');
  
  console.log("Sidebar - Links available:", links);
  console.log("Sidebar - isAdmin check result:", isAdmin);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="h-full border-r bg-background w-full">
        <div className="py-4">
          {links.map((item) => (
            <SidebarItem 
              key={item.path}
              href={item.path}
              title={item.name}
              icon={pathIconMap[item.path] || BarChart}
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
            <SheetTitle>Acme Co.</SheetTitle>
            <SheetDescription>
              Manage your shop, view reports, and more.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {links.map((item) => (
              <SidebarItem 
                key={item.path}
                href={item.path}
                title={item.name}
                icon={pathIconMap[item.path] || BarChart}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

