
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './header/Logo';
import { DesktopNavigation } from './header/DesktopNavigation';
import { MobileMenu } from './header/MobileMenu';
import { UserProfileDropdown } from './header/UserProfileDropdown';
import { UserDisplay } from './header/UserDisplay';
import { MobileMenuButton } from './header/MobileMenuButton';
import { PortalIndicator } from './header/PortalIndicator';
import { useNavigationLinks } from './header/NavigationLinks';
import { useHeaderContext } from './HeaderContext';

interface HeaderProps {
  portalType: 'shop' | 'customer';
}

const Header = ({ portalType }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { links, isAdmin } = useNavigationLinks(portalType);
  
  const { isHeaderMounted, setHeaderMounted } = useHeaderContext();
  
  useEffect(() => {
    if (isHeaderMounted) {
      console.log('Header already mounted, skipping render');
      return;
    }
    
    setHeaderMounted(true);
    
    return () => {
      setHeaderMounted(false);
    };
  }, [isHeaderMounted, setHeaderMounted]);
  
  if (isHeaderMounted && !document.querySelector('[data-header-id="' + portalType + '"]')) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" data-header-id={portalType}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Logo portalType={portalType} />
          
          {/* Desktop Navigation */}
          <DesktopNavigation links={links} currentPath={location.pathname} />
          
          {/* User info and controls */}
          <div className="flex items-center gap-4">
            <UserDisplay />
            <UserProfileDropdown />
            <MobileMenuButton 
              isOpen={mobileMenuOpen} 
              toggleMenu={toggleMobileMenu} 
            />
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <MobileMenu 
            links={links} 
            isAdmin={isAdmin} 
            portalType={portalType} 
            closeMenu={closeMobileMenu}
          />
        )}
      </div>
      
      {/* Portal indicator */}
      <PortalIndicator portalType={portalType} />
    </header>
  );
};

export default Header;
