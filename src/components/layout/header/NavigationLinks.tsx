
import { useAuth } from "@/contexts/auth";

export interface NavigationLink {
  name: string;
  path: string;
  adminOnly?: boolean;
  children?: NavigationLink[];
}

export const useNavigationLinks = (portalType: 'shop' | 'customer') => {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const customerLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/customer' },
    { name: 'Estimates', path: '/customer/estimates' },
    { name: 'Invoices', path: '/customer/invoices' },
    { name: 'Work Orders', path: '/customer/work-orders' },
    { name: 'Vehicles', path: '/customer/vehicles' },
    { name: 'Parts & Accessories', path: '/customer/parts' },
    { name: 'Transactions', path: '/customer/transactions' },
    { name: 'Profile', path: '/customer/profile' }
  ];
  
  // Group shop links into categories with dropdowns
  const shopLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/shop' },
    { 
      name: 'Customers', 
      path: '/shop/customers',
      children: [
        { name: 'Service Desk', path: '/shop/service-desk' },
        { name: 'Service Appointments', path: '/shop/service-appointments' },
      ] 
    },
    { 
      name: 'Documents', 
      path: '#', 
      children: [
        { name: 'Estimates', path: '/shop/estimates' },
        { name: 'Work Orders', path: '/shop/work-orders' },
        { name: 'Invoices', path: '/shop/invoices' },
      ]
    },
    { 
      name: 'Inventory', 
      path: '#', 
      children: [
        { name: 'Parts & Accessories', path: '/shop/parts' },
        { name: 'Inventory', path: '/shop/inventory' },
        { name: 'Simple Inventory', path: '/shop/inventory/simple' }
      ]
    },
    { name: 'Reports', path: '/shop/reports' }
  ];
  
  // Admin-only links
  const adminLinks: NavigationLink[] = [
    { 
      name: 'Admin', 
      path: '#', 
      adminOnly: true,
      children: [
        { name: 'Employees', path: '/shop/employees', adminOnly: true },
        { name: 'Settings', path: '/shop/admin', adminOnly: true }
      ]
    }
  ];
  
  const allShopLinks = isAdmin ? [...shopLinks, ...adminLinks] : shopLinks;
  
  return {
    links: portalType === 'customer' ? customerLinks : allShopLinks,
    isAdmin
  };
};
