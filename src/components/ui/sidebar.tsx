
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
import { SidebarItem } from "./SidebarItem";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Users, BarChart, Package, ListChecks, UserPlus, Settings, FileText, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  children?: React.ReactNode;
  showNavigation?: boolean;
}

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

export const Sidebar = ({ children, showNavigation = true }: Props) => {
  const { user } = useAuth();
  
  console.log("Sidebar - Current user:", user?.email);
  console.log("Sidebar - User metadata:", user?.app_metadata);
  console.log("Sidebar - User role in app metadata:", user?.app_metadata?.role);
  
  // Debug output to see if the admin check is working correctly
  const isAdmin = user?.app_metadata?.role === 'admin';
  console.log("Sidebar - isAdmin check result:", isAdmin);

  const filteredNavigationItems = navigationItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="h-full border-r bg-background p-0">
        <div className="py-4">
          {showNavigation && filteredNavigationItems.map((item) => (
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
      {showNavigation && (
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
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
