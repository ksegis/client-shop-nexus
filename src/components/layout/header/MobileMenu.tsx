
import { Link } from 'react-router-dom';
import { Shield, Activity, Key, Users } from 'lucide-react';

interface NavigationLink {
  name: string;
  path: string;
}

interface MobileMenuProps {
  links: NavigationLink[];
  isAdmin: boolean;
  portalType: 'customer' | 'shop';
  closeMenu: () => void;
}

export const MobileMenu = ({ links, isAdmin, portalType, closeMenu }: MobileMenuProps) => {
  return (
    <nav className="md:hidden pt-2 pb-4 px-2">
      <div className="flex flex-col space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className="text-gray-600 hover:text-shop-primary px-3 py-2 rounded-md font-medium"
            onClick={closeMenu}
          >
            {link.name}
          </Link>
        ))}
        
        {/* Add admin links in mobile menu */}
        {isAdmin && portalType === 'shop' && (
          <>
            <div className="h-px bg-gray-200 my-2" />
            <div className="px-3 py-1 text-xs font-semibold text-gray-500">
              Admin
            </div>
            <Link
              to="/shop/admin"
              className="text-gray-600 hover:text-shop-primary px-3 py-2 rounded-md font-medium"
              onClick={closeMenu}
            >
              Admin Dashboard
            </Link>
            <Link
              to="/shop/admin/api-keys"
              className="text-gray-600 hover:text-shop-primary px-3 py-2 rounded-md font-medium"
              onClick={closeMenu}
            >
              API Keys
            </Link>
            <Link
              to="/shop/admin/staff"
              className="text-gray-600 hover:text-shop-primary px-3 py-2 rounded-md font-medium"
              onClick={closeMenu}
            >
              Staff Management
            </Link>
            <Link
              to="/shop/admin/system"
              className="text-gray-600 hover:text-shop-primary px-3 py-2 rounded-md font-medium"
              onClick={closeMenu}
            >
              System Health
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
