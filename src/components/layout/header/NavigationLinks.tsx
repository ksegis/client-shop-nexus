
// NavigationLinks.tsx - Helper file to centralize navigation links
import { useAuth } from '@/contexts/auth';

export interface NavigationLink {
  name: string;
  path: string;
  adminOnly?: boolean;
}

export const useNavigationLinks = (portalType: 'customer' | 'shop') => {
  const { user } = useAuth();
  const isAdmin = user?.app_metadata?.role === 'admin';
  
  const customerLinks: NavigationLink[] = [
    { name: 'Profile', path: '/customer/profile' },
    { name: 'Estimates', path: '/customer/estimates' },
    { name: 'Invoices', path: '/customer/invoices' },
    { name: 'Transaction History', path: '/customer/transactions' }
  ];
  
  const shopLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/shop' },
    { name: 'Reports', path: '/shop/reports' },
    { name: 'Employees', path: '/shop/employees' },
    { name: 'Inventory', path: '/shop/inventory' },
    { name: 'Work Orders', path: '/shop/work-orders' },
    { name: 'Customers', path: '/shop/customers' },
    { name: 'Estimates', path: '/shop/estimates' },
    { name: 'Invoices', path: '/shop/invoices' }
  ];
  
  // Add Users link for admin users
  if (isAdmin && portalType === 'shop') {
    shopLinks.push({ name: 'Users', path: '/shop/users' });
  }
  
  return {
    links: portalType === 'customer' ? customerLinks : shopLinks,
    isAdmin
  };
};
