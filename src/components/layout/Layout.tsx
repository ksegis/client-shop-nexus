
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import { HeaderProvider } from './HeaderContext';

interface LayoutProps {
  portalType: 'shop';
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ portalType, children }) => {
  const location = useLocation();
  
  // Debug the current path
  console.log('Current path:', location.pathname);
  
  // We should only hide the header on very specific standalone pages
  const isStandalonePage = 
    (location.pathname === '/auth') || 
    (location.pathname === '/shop/login');
  
  return (
    <HeaderProvider>
      <div className="h-screen flex flex-col">
        {!isStandalonePage && <Header portalType={portalType} />}
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </HeaderProvider>
  );
};

export default Layout;
