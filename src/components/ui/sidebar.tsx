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
import { Shield, Users, BarChart, Package, ListChecks, UserPlus, FileBarGraph, Settings } from "lucide-react";

interface Props {
  children: React.ReactNode;
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
    icon: FileBarGraph,
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
    icon: ListChecks,
  },
  {
    title: "Invoices",
    href: "/shop/invoices",
    icon: Settings,
  },
  {
    title: "User Management",
    href: "/shop/users",
    icon: Shield,
    adminOnly: true
  }
];

export const Sidebar = ({ children }: Props) => {
  const { user } = useAuth();

  return (
    <div className="md:flex">
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
            {navigationItems
              .filter(item => !item.adminOnly || user?.role === 'admin')
              .map((item) => (
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
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
};
