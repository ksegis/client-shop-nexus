
import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

interface LogoProps {
  portalType: 'shop' | 'customer';
}

export const Logo = ({ portalType }: LogoProps) => {
  return (
    <div className="flex items-center">
      <Link to={portalType === 'customer' ? '/customer' : '/shop'}>
        <div className="h-10 w-40 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Wrench className="h-6 w-6 text-shop-primary" />
            <span className="font-bold text-lg text-shop-primary">
              {portalType === 'customer' ? 'Custom Truck Connections' : 'Custom Truck Connections'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
