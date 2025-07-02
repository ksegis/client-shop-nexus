import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface NavigationLink {
  name: string;
  path: string;
  icon?: string;
  children?: NavigationLink[];
  badge?: string | number;
}

interface MobileMenuProps {
  links: NavigationLink[];
  portalType: 'customer' | 'shop';
  closeMenu: () => void;
}

// Helper function to get Lucide icon component
const getIcon = (iconName?: string) => {
  if (!iconName) return null;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
};

export const MobileMenu = ({ links, portalType, closeMenu }: MobileMenuProps) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  
  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };
  
  return (
    <nav className="md:hidden pt-2 pb-4 px-2 bg-white border-t border-gray-100">
      <div className="flex flex-col space-y-1">
        {links.map((link) => (
          <div key={link.name} className="flex flex-col">
            {/* If link has children, render as collapsible section */}
            {link.children && link.children.length > 0 ? (
              <>
                <button
                  onClick={() => toggleSubmenu(link.name)}
                  className="flex justify-between items-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    {getIcon(link.icon)}
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  {expandedMenus[link.name] ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </button>
                
                {expandedMenus[link.name] && (
                  <div className="pl-6 border-l-2 border-blue-100 ml-6 mt-1 mb-2 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.path}
                        className="flex items-center gap-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-lg font-medium transition-colors duration-200"
                        onClick={closeMenu}
                      >
                        {getIcon(child.icon)}
                        <span>{child.name}</span>
                        {child.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Regular link without children
              <Link
                to={link.path}
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                onClick={closeMenu}
              >
                {getIcon(link.icon)}
                <span>{link.name}</span>
                {link.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {link.badge}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

