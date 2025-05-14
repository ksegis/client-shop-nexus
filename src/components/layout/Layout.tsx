
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';

interface LayoutProps {
  portalType: 'customer' | 'shop';
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ portalType, children }) => {
  const location = useLocation();
  
  // Check if we're on a page that already includes its own header
  const isStandalonePage = location.pathname.includes('/customer/') && 
    (location.pathname.endsWith('/transactions') || 
     location.pathname.endsWith('/checkout') ||
     location.pathname.endsWith('/profile') ||
     location.pathname.endsWith('/estimates') ||
     location.pathname.endsWith('/invoices') ||
     location.pathname.endsWith('/parts'));
  
  return (
    <div className="h-screen flex flex-col">
      {!isStandalonePage && <Header portalType={portalType} />}
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
