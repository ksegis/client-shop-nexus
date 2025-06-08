
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  portalType: 'shop' | 'customer';
}

export const Logo = ({ portalType }: LogoProps) => {
  return (
    <div className="flex items-center">
      <Link to={portalType === 'customer' ? '/customer' : '/shop'}>
        <div className="h-10 w-40 flex items-center justify-center">
          <img 
            src="https://aw1.imgix.net/aw/_content/site/customtruckconnections/Logos/Logo-Primary.png?auto=format&dpr=2&fit=max&h=200&q=95&w=500"
            alt="Custom Truck Connections"
            className="h-8 w-auto max-w-full object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>
      </Link>
    </div>
  );
};
