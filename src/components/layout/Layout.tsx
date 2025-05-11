
import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  portalType: 'customer' | 'shop';
}

const Layout = ({ children, portalType }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header portalType={portalType} />
      <main className="flex-1 bg-white">
        <div className="shop-container py-6">
          {children}
        </div>
      </main>
      <footer className="bg-gray-100 py-4 border-t border-gray-200">
        <div className="shop-container">
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Shop Management System</p>
            <p className="text-xs mt-1">
              {/* Comment for integration */}
              {/* TODO: Dynamic data fetching happens via GHL → Zapier → Supabase */}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
