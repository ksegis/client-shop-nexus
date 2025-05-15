
import { useAuth } from "@/contexts/auth";

export interface NavigationLink {
  name: string;
  path: string;
  adminOnly?: boolean;
}

export const useNavigationLinks = (portalType: 'shop' | 'customer') => {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'test_admin';
  
  const customerLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/customer' },
    { name: 'Estimates', path: '/customer/estimates' },
    { name: 'Invoices', path: '/customer/invoices' },
    { name: 'Work Orders', path: '/customer/work-orders' },
    { name: 'Vehicles', path: '/customer/vehicles' },
    { name: 'Parts', path: '/customer/parts' },
    { name: 'Transactions', path: '/customer/transactions' },
    { name: 'Profile', path: '/customer/profile' }
  ];
  
  // Reordered according to the specified sequence
  const shopLinks: NavigationLink[] = [
    { name: 'Dashboard', path: '/shop' },
    { name: 'Customers', path: '/shop/customers' },
    { name: 'Estimates', path: '/shop/estimates' },
    { name: 'Work Orders', path: '/shop/work-orders' },
    { name: 'Invoices', path: '/shop/invoices' },
    { name: 'Parts', path: '/shop/parts' },
    { name: 'Inventory', path: '/shop/inventory' },
    { name: 'Reports', path: '/shop/reports' }
  ];
  
  // Admin-only links
  const adminLinks: NavigationLink[] = [
    { name: 'Employees', path: '/shop/employees', adminOnly: true },
    { name: 'Admin', path: '/shop/admin', adminOnly: true }
  ];
  
  const allShopLinks = isAdmin ? [...shopLinks, ...adminLinks] : shopLinks;
  
  return {
    links: portalType === 'customer' ? customerLinks : allShopLinks,
    isAdmin
  };
};
