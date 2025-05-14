
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
    { name: 'Transaction History', path: '/customer/transactions' },
    { name: 'Parts Catalog', path: '/customer/parts' }
  ];
  
  // Reordered according to the specified sequence
  const shopLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/shop' },
    { name: 'Service Desk', path: '/shop/service-desk' },
    { name: 'Customers', path: '/shop/customers' },
    { name: 'Estimates', path: '/shop/estimates' },
    { name: 'Invoices', path: '/shop/invoices' },
    { name: 'Parts Desk', path: '/shop/parts' },
    { name: 'Inventory', path: '/shop/inventory' },
    { name: 'Reports', path: '/shop/reports' },
    { name: 'Employees', path: '/shop/employees' }
  ];
  
  // Admin links for shop portal
  const adminLinks: NavigationLink[] = [
    { name: 'Admin', path: '/shop/admin', adminOnly: true }
  ];
  
  // Add admin links for admin users
  const allShopLinks = isAdmin ? [...shopLinks, ...adminLinks] : shopLinks;
  
  return {
    links: portalType === 'customer' ? customerLinks : allShopLinks,
    isAdmin
  };
};
