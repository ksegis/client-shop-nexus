
import { useState, useMemo, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { useToast } from '@/hooks/use-toast';
import { logAuditEvent, AuditLogType } from '@/utils/auditUtils';

export function useDevMode() {
  // BLOCK ALL DEV MODE ACCESS IN PRODUCTION
  if (import.meta.env.PROD) {
    // Log the production mode enforcement
    if (typeof window !== 'undefined') { // Check if running in browser
      logAuditEvent(AuditLogType.DEV_MODE_DISABLED, {
        reason: 'Production environment detected',
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      isDevMode: false,
      setIsDevMode: () => console.error('Dev mode disabled in production'),
      devUser: null as User | null,
      mockProfile: null as UserProfile | null,
      useDevCustomer: false,
      showDevModeNotification: () => console.error('Dev mode disabled in production')
    };
  }
  
  const { toast } = useToast();
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [alreadyNotified, setAlreadyNotified] = useState<boolean>(false);
  
  // Define static mock user for development
  const mockUser = useMemo(() => ({
    id: 'mock-user-id',
    email: 'dev@example.com',
    app_metadata: {
      role: 'admin'
    },
    user_metadata: {
      first_name: 'Dev',
      last_name: 'User',
      phone: '555-1234',
      role: 'admin'
    },
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as User), []);
  
  // Define mock customer user for development
  const mockCustomerUser = useMemo(() => {
    const storedCustomer = localStorage.getItem('dev-customer-user');
    return storedCustomer ? JSON.parse(storedCustomer) as User : null;
  }, []);
  
  // Check if we should use dev customer mode
  const useDevCustomer = !!mockCustomerUser;
  
  // Select the appropriate mock user
  const devUser = useDevCustomer ? mockCustomerUser : mockUser;
  
  // Create appropriate mock profile
  const mockProfile: UserProfile = useMemo(() => ({
    id: devUser.id,
    email: devUser.email || '',
    first_name: devUser.user_metadata?.first_name || '',
    last_name: devUser.user_metadata?.last_name || '',
    role: devUser.user_metadata?.role as 'admin' | 'staff' | 'customer'
  }), [devUser]);

  // Effect to log dev mode enablement
  useEffect(() => {
    if (isDevMode) {
      logAuditEvent(AuditLogType.DEV_MODE_ENABLED, {
        user: devUser.email,
        role: mockProfile.role,
        useDevCustomer
      });
    }
  }, [isDevMode, devUser.email, mockProfile.role, useDevCustomer]);

  // Show dev mode notification (once)
  const showDevModeNotification = () => {
    if (!alreadyNotified) {
      console.log('Development mode: Using mock authentication');
      setIsDevMode(true);
      
      if (useDevCustomer) {
        toast({
          title: "Customer Development Mode",
          description: "Using mock customer authentication credentials",
        });
        
        logAuditEvent(AuditLogType.DEV_CUSTOMER_IMPERSONATION, {
          customer: devUser.email,
          timestamp: new Date().toISOString()
        });
      } else {
        toast({
          title: "Development Mode",
          description: "Using mock authentication credentials",
        });
      }
      setAlreadyNotified(true);
    }
  };
  
  return {
    isDevMode,
    setIsDevMode,
    devUser,
    mockProfile,
    useDevCustomer,
    showDevModeNotification
  };
}
