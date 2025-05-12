
import React from 'react';
import Header from './Header';
import { cn } from '@/lib/utils';
import ImpersonationBanner from '@/components/admin/ImpersonationBanner';

interface LayoutProps {
  children: React.ReactNode;
  portalType?: 'shop' | 'customer';
  className?: string;
}

const Layout = ({ children, portalType = 'shop', className }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ImpersonationBanner />
      <Header portalType={portalType} />
      <div className="flex-1">
        <div className={cn("container max-w-screen-xl mx-auto py-8 px-4", className)}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
