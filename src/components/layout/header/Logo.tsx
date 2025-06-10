import React from 'react';
import { Link } from 'react-router-dom';
import ctcLogo from '../../../assets/ctc_logo.jpg';

interface LogoProps {
  portalType: 'shop' | 'customer';
}

export const Logo = ({ portalType }: LogoProps) => {
  return (
    <div className="flex items-center">
      <Link to={portalType === 'customer' ? '/customer' : '/shop'}>
        <div className="h-12 flex items-center">
          <img 
            src={ctcLogo} 
            alt="Custom Truck Connections" 
            className="ctc-logo"
          />
        </div>
      </Link>
    </div>
  );
};

