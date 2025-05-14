
import { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderContextType {
  isHeaderMounted: boolean;
  setHeaderMounted: (mounted: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [isHeaderMounted, setHeaderMounted] = useState(false);

  return (
    <HeaderContext.Provider value={{ isHeaderMounted, setHeaderMounted }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeaderContext() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeaderContext must be used within a HeaderProvider');
  }
  return context;
}
