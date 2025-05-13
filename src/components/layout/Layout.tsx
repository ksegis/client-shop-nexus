
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

interface LayoutProps {
  portalType: 'customer' | 'shop';
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ portalType, children }) => {
  return (
    <div className="h-screen flex flex-col">
      <Header portalType={portalType} />
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
