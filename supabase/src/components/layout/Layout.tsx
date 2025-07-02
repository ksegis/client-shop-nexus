
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { HeaderProvider, useHeaderContext } from './HeaderContext';
import { ImpersonationBanner } from '@/components/shared/ImpersonationBanner';

interface LayoutProps {
  portalType: 'shop' | 'customer';
  children?: React.ReactNode;
}

const LayoutContent: React.FC<LayoutProps> = ({ portalType, children }) => {
  const location = useLocation();
  const { setHeaderMounted } = useHeaderContext();
  
  // For debugging purposes
  useEffect(() => {
    console.log("Layout rendering with path:", location.pathname);
  }, [location.pathname]);
  
  // Reset header mounted state on location change
  useEffect(() => {
    setHeaderMounted(false);
  }, [location.pathname, setHeaderMounted]);
  
  // We should only hide the header on very specific standalone pages
  const isStandalonePage = 
    (location.pathname === '/auth') || 
    (location.pathname === '/shop/login');

  return (
    <div className="h-screen flex flex-col">
      {!isStandalonePage && <Header portalType={portalType} />}
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <ImpersonationBanner />
        {children || <Outlet />}
      </main>
    </div>
  );
};

// Single HeaderProvider wrapper - no nested providers
const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <HeaderProvider>
      <LayoutContent {...props} />
    </HeaderProvider>
  );
};

export default Layout;
