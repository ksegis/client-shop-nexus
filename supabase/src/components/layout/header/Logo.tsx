import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// Only import the existing JPG that we know exists
import ctcLogo from '../../../assets/ctc_logo.jpg';

interface LogoProps {
  portalType: 'shop' | 'customer';
  theme?: 'light' | 'dark' | 'auto';
  size?: 'small' | 'normal' | 'large';
}

export const Logo = ({ portalType, theme = 'auto', size = 'normal' }: LogoProps) => {
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

  // Generate CSS classes based on props
  const getLogoClasses = () => {
    const baseClass = 'nav-logo';
    const sizeClass = size !== 'normal' ? `${baseClass}-${size}` : '';
    const themeClass = isDarkMode ? `${baseClass}-dark` : '';
    
    return [baseClass, sizeClass, themeClass].filter(Boolean).join(' ');
  };

  // Get the appropriate link destination
  const getLinkDestination = () => {
    return portalType === 'customer' ? '/customer' : '/shop';
  };

  return (
    <div className="flex items-center">
      <Link 
        to={getLinkDestination()}
        className="flex items-center"
        aria-label={`Go to ${portalType} dashboard`}
      >
        <img 
          src={ctcLogo} 
          alt="Custom Truck Connections" 
          className={getLogoClasses()}
          // Removed inline styles - now using clean CSS classes
          loading="eager" // Logo should load immediately
          decoding="sync" // Synchronous decoding for critical logo
        />
      </Link>
    </div>
  );
};

