
import { Link } from 'react-router-dom';
import { Shield, Activity, Key, Users, Webhook } from 'lucide-react';

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
  // Filter links that should appear in the main navigation
  const mainLinks = links.filter(link => !link.path.includes('/admin/'));
  // Filter admin links
  const adminLinks = links.filter(link => link.path.includes('/admin/'));

  return (
    <nav className="md:hidden pt-2 pb-4 px-2">
      <div className="flex flex-col space-y-2">
        {mainLinks.map((link) => (
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
        {isAdmin && adminLinks.length > 0 && (
          <>
            <div className="h-px bg-gray-200 my-2" />
            <div className="px-3 py-1 text-xs font-semibold text-gray-500">
              Admin
            </div>
            {adminLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-600 hover:text-shop-primary px-3 py-2 rounded-md font-medium"
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            ))}
          </>
        )}
      </div>
    </nav>
  );
};
