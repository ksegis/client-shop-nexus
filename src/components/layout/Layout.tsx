
import React from 'react';
import Header from './Header';
import { Sidebar } from '../ui/sidebar';
import ImpersonationBanner from '../admin/ImpersonationBanner';
import { isImpersonating } from '@/utils/admin/impersonationUtils';

interface LayoutProps {
  portalType: 'customer' | 'shop';
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ portalType, children }) => {
  return (
    <div className="h-screen flex flex-col">
      {isImpersonating() && <ImpersonationBanner />}
      <Header portalType={portalType} />
      {portalType === 'shop' ? (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar>
            <main className="flex-1 overflow-auto p-4 md:p-6">
              {children}
            </main>
          </Sidebar>
        </div>
      ) : (
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      )}
    </div>
  );
};

export default Layout;
