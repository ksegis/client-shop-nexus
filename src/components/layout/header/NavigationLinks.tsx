import { useAuth } from "@/contexts/auth";

export interface NavigationLink {
  name: string;
  path: string;
  icon?: string;
  children?: NavigationLink[];
  badge?: string | number;
}

export const useNavigationLinks = (portalType: 'shop' | 'customer') => {
  const { user, profile } = useAuth();
  
  const customerLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: 'Home' },
    { name: 'Estimates', path: '/customer/estimates', icon: 'FileText' },
    { name: 'Invoices', path: '/customer/invoices', icon: 'Receipt' },
    { name: 'Work Orders', path: '/customer/work-orders', icon: 'Wrench' },
    { name: 'Vehicles', path: '/customer/vehicles', icon: 'Truck' },
    { name: 'Parts & Accessories', path: '/customer/parts', icon: 'Package' },
    { name: 'Transactions', path: '/customer/transactions', icon: 'CreditCard' },
    { name: 'Profile', path: '/customer/profile', icon: 'User' }
  ];
  
  // Simplified shop navigation - 6 main sections
  const shopLinks: NavigationLink[] = [
    { 
      name: 'Dashboard', 
      path: '/shop/dashboard',
      icon: 'Home'
    },
    { 
      name: 'Customers', 
      path: '/shop/customers',
      icon: 'Users',
      children: [
        { name: 'Customer Management', path: '/shop/customers', icon: 'Users' },
        { name: 'Service Desk', path: '/shop/service-desk', icon: 'Headphones' },
        { name: 'Appointments', path: '/shop/service-appointments', icon: 'Calendar' },
      ] 
    },
    { 
      name: 'Service', 
      path: '/shop/service',
      icon: 'Wrench',
      children: [
        { name: 'Work Orders', path: '/shop/work-orders', icon: 'ClipboardList' },
        { name: 'Estimates', path: '/shop/estimates', icon: 'FileText' },
        { name: 'Invoices', path: '/shop/invoices', icon: 'Receipt' },
        { name: 'Vehicles', path: '/shop/vehicles', icon: 'Truck' },
      ]
    },
    { 
      name: 'Parts & Inventory', 
      path: '/shop/parts',
      icon: 'Package',
      children: [
        { name: 'Parts Catalog', path: '/shop/parts', icon: 'Package' },
        { name: 'Inventory Management', path: '/shop/inventory', icon: 'Archive' },
        { name: 'Special Orders', path: '/shop/parts?tab=special-orders', icon: 'ShoppingCart' },
        // Add admin-only inventory and pricing management
        ...(profile?.role === 'admin' ? [
          { name: 'Inventory Sync', path: '/shop/admin/inventory-sync', icon: 'RefreshCw' },
          { name: 'Pricing Management', path: '/shop/admin/pricing', icon: 'DollarSign' },
        ] : [])
      ]
    },
    { 
      name: 'Reports', 
      path: '/shop/reports',
      icon: 'BarChart3'
    },
    { 
      name: 'Settings', 
      path: '/shop/settings',
      icon: 'Settings',
      children: profile?.role === 'admin' ? [
        { name: 'User Management', path: '/shop/admin/user-management', icon: 'UserCog' },
        { name: 'System Settings', path: '/shop/settings/system', icon: 'Cog' },
        { name: 'Keystone Config', path: '/shop/admin/keystone-config', icon: 'Key' },
      ] : [
        { name: 'Profile Settings', path: '/shop/settings/profile', icon: 'User' },
        { name: 'Preferences', path: '/shop/settings/preferences', icon: 'Sliders' },
      ]
    }
  ];
  
  return {
    links: portalType === 'customer' ? customerLinks : shopLinks,
    isAdmin: profile?.role === 'admin'
  };
};

