import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Only import the existing JPG that we know exists
import ctcLogo from '../../../assets/ctc_logo.jpg';

interface LogoProps {
  portalType: 'shop' | 'customer';
  theme?: 'light' | 'dark' | 'auto';
}

export const Logo = ({ portalType, theme = 'auto' }: LogoProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect system color scheme if theme is set to auto
  useEffect(() => {
    if (theme === 'auto') {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeMediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      darkModeMediaQuery.addEventListener('change', handleChange);
      
      return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    } else {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex items-center">
      <Link to={portalType === 'customer' ? '/customer' : '/shop'}>
        <div className="flex items-center">
          <img 
            src={ctcLogo} 
            alt="Custom Truck Connections" 
            className="nav-logo"
            // Fallback inline styles if nav-logo class isn't defined yet
            style={{ 
              maxHeight: '32px', 
              width: 'auto', 
              height: 'auto',
              marginRight: '16px'
            }}
          />
        </div>
      </Link>
    </div>
  );
};
