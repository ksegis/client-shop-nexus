
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { Sidebar } from '../ui/sidebar';

interface LayoutProps {
  portalType: 'customer' | 'shop';
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ portalType, children }) => {
  return (
    <div className="h-screen flex flex-col">
      <Header portalType={portalType} />
      
      {portalType === 'shop' ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children || <Outlet />}
          </main>
        </div>
      ) : (
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children || <Outlet />}
        </main>
      )}
    </div>
  );
};

export default Layout;
