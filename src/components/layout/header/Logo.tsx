
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
          <span className="text-lg font-semibold text-gray-800">Logo</span>
        </div>
      </Link>
    </div>
  );
};
