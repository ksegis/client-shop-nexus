
import { useAuth } from "@/contexts/auth";

export interface NavigationLink {
  name: string;
  path: string;
  children?: NavigationLink[];
}

export const useNavigationLinks = (portalType: 'shop' | 'customer') => {
  const { user, profile } = useAuth();
  
  const customerLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/customer/dashboard' },
    { name: 'Estimates', path: '/customer/estimates' },
    { name: 'Invoices', path: '/customer/invoices' },
    { name: 'Work Orders', path: '/customer/work-orders' },
    { name: 'Vehicles', path: '/customer/vehicles' },
    { name: 'Parts & Accessories', path: '/customer/parts' },
    { name: 'Transactions', path: '/customer/transactions' },
    { name: 'Profile', path: '/customer/profile' }
  ];
  
  // Shop links with admin functionality for admin users
  const shopLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/shop/dashboard' },
    { 
      name: 'Customers', 
      path: '/shop/customers',
      children: [
        { name: 'Service Desk', path: '/shop/service-desk' },
        { name: 'Service Appointments', path: '/shop/service-appointments' },
      ] 
    },
    { name: 'Vehicles', path: '/shop/vehicles' },
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
        { name: 'Inventory', path: '/shop/inventory' }
      ]
    },
    { name: 'Reports', path: '/shop/reports' }
  ];

  // Add admin section for admin users
  if (profile?.role === 'admin') {
    shopLinks.push({
      name: 'Admin',
      path: '#',
      children: [
        { name: 'User Management', path: '/shop/admin/user-management' }
      ]
    });
  }
  
  return {
    links: portalType === 'customer' ? customerLinks : shopLinks,
    isAdmin: profile?.role === 'admin'
  };
};
