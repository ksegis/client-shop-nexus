
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface NavigationLink {
  name: string;
  path: string;
  children?: NavigationLink[];
}

interface MobileMenuProps {
  links: NavigationLink[];
  portalType: 'customer' | 'shop';
  closeMenu: () => void;
}

export const MobileMenu = ({ links, portalType, closeMenu }: MobileMenuProps) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  
  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };
  
  return (
    <nav className="md:hidden pt-2 pb-4 px-2">
      <div className="flex flex-col space-y-1">
        {links.map((link) => (
          <div key={link.name} className="flex flex-col">
            {/* If link has children, render as collapsible section */}
            {link.children && link.children.length > 0 ? (
              <>
                <button
                  onClick={() => toggleSubmenu(link.name)}
                  className="flex justify-between items-center text-gray-600 hover:text-shop-primary hover:bg-gray-50 px-3 py-2 rounded-md font-medium"
                >
                  <span>{link.name}</span>
                  {expandedMenus[link.name] ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </button>
                
                {expandedMenus[link.name] && (
                  <div className="pl-4 border-l border-gray-200 ml-4 mt-1 mb-1 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.path}
                        className="text-gray-600 hover:text-shop-primary block px-3 py-2 rounded-md font-medium"
                        onClick={closeMenu}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Regular link without children
              <Link
                to={link.path}
                className="text-gray-600 hover:text-shop-primary px-3 py-2 rounded-md font-medium"
                onClick={closeMenu}
              >
                {link.name}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};
