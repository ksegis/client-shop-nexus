import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Import both logo variants - you'll need to create these assets
import logoLight from '../../../assets/ctc_logo_light.svg';
import logoDark from '../../../assets/ctc_logo_dark.svg';
import logoMobile from '../../../assets/ctc_logo_icon.svg';

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

  // Determine which logo to use based on theme and viewport size
  const getLogo = () => {
    if (isMobile) {
      return logoMobile;
    }
    return isDarkMode ? logoLight : logoDark;
  };

  return (
    <div className="flex items-center">
      <Link to={portalType === 'customer' ? '/customer' : '/shop'}>
        <div className="flex items-center">
          <img 
            src={getLogo()} 
            srcSet={`${getLogo()} 1x, ${getLogo()} 2x`} // Replace with actual 2x versions when available
            alt="Custom Truck Connections" 
            className="nav-logo"
          />
        </div>
      </Link>
    </div>
  );
};

