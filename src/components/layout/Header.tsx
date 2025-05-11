import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User } from 'lucide-react';

interface HeaderProps {
  portalType: 'customer' | 'shop';
}

const Header = ({ portalType }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const customerLinks = [
    { name: 'Profile', path: '/customer/profile' },
    { name: 'Estimates', path: '/customer/estimates' },
    { name: 'Invoices', path: '/customer/invoices' },
    { name: 'Transaction History', path: '/customer/transactions' }
  ];
  
  const shopLinks = [
    { name: 'Dashboard', path: '/shop' },
    { name: 'Reports', path: '/shop/reports' },
    { name: 'Employees', path: '/shop/employees' },
    { name: 'Inventory', path: '/shop/inventory' },
    { name: 'Work Orders', path: '/shop/work-orders' },
    { name: 'Customers', path: '/shop/customers' },
    { name: 'Estimates', path: '/shop/estimates' },
    { name: 'Invoices', path: '/shop/invoices' }
  ];
  
  const links = portalType === 'customer' ? customerLinks : shopLinks;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="shop-container">
        <div className="flex justify-between items-center py-3">
          {/* Logo placeholder */}
          <div className="flex items-center">
            <Link to={portalType === 'customer' ? '/customer' : '/shop'}>
              <div className="h-10 w-40 bg-shop-light flex items-center justify-center text-shop-primary font-bold">
                LOGO PLACEHOLDER
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {links.map((link) => (
              <Link 
                key={link.name}
                to={link.path}
                className={`text-gray-600 hover:text-shop-primary font-medium ${
                  location.pathname === link.path ? 'text-shop-primary' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          {/* User profile/login button */}
          <div className="flex items-center gap-4">
            <Link to={portalType === 'customer' ? '/customer/profile' : '/shop/profile'}>
              <Button variant="ghost" size="sm" className="rounded-full p-2">
                <User className="h-5 w-5 text-shop-primary" />
              </Button>
            </Link>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden rounded-full p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-shop-primary" />
              ) : (
                <Menu className="h-5 w-5 text-shop-primary" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pt-2 pb-4 px-2">
            <div className="flex flex-col space-y-2">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-gray-600 hover:text-shop-primary px-3 py-2 rounded-md font-medium ${
                    location.pathname === link.path ? 'text-shop-primary' : ''
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
      
      {/* Portal indicator */}
      <div className={`py-1 text-center text-white text-xs font-medium ${portalType === 'customer' ? 'bg-shop-primary' : 'bg-shop-dark'}`}>
        {portalType === 'customer' ? 'CUSTOMER PORTAL' : 'SHOP MANAGEMENT PORTAL'}
      </div>
    </header>
  );
};

export default Header;
