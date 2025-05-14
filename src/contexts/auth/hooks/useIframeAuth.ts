
import { useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { toast } from '@/hooks/use-toast';

// Types for messages from parent frame
interface AuthMessage {
  type: 'auth-token' | 'auth-error' | 'iframe-pos';
  token?: string;
  user?: any;
  error?: string;
  position?: any;
}

export function useIframeAuth() {
  const [iframeAuth, setIframeAuth] = useState<{
    enabled: boolean;
    user: User | null;
    profile: UserProfile | null;
  }>({
    enabled: false,
    user: null,
    profile: null
  });

  // Check if we're in an iframe
  const isInIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // If we can't access parent due to security, we're probably in an iframe
    }
  }, []);

  // Trusted origins that can send messages to this iframe
  const trustedOrigins = useMemo(() => [
    'https://egisdynamics.com',
    'https://app.egisdynamics.com',
    'https://lovable.dev',  // Added to prevent warnings from development environment
    window.location.origin  // Always trust messages from same origin
  ], []);

  // Listen for authentication messages from parent frame
  useEffect(() => {
    if (!isInIframe) return;

    const handleAuthMessage = (event: MessageEvent) => {
      // Skip logging for common non-critical messages
      const isKnownNonCriticalOrigin = event.origin === 'https://lovable.dev';
      
      // Validate origin
      if (!trustedOrigins.includes(event.origin)) {
        // Only log warnings for unexpected origins (not from known development tools)
        if (!isKnownNonCriticalOrigin) {
          console.warn('Received message from untrusted origin:', event.origin);
        }
        return;
      }

      const data = event.data as AuthMessage;

      // Handle different message types
      switch (data.type) {
        case 'auth-token':
          if (data.token && data.user) {
            // Create user and profile from parent data
            const parentUser: User = {
              id: data.user.id,
              email: data.user.email,
              app_metadata: {
                role: data.user.role
              },
              user_metadata: {
                first_name: data.user.firstName,
                last_name: data.user.lastName,
                role: data.user.role,
              },
              aud: 'authenticated',
              created_at: new Date().toISOString()
            };

            const parentProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email,
              first_name: data.user.firstName,
              last_name: data.user.lastName,
              role: data.user.role,
            };

            setIframeAuth({
              enabled: true,
              user: parentUser,
              profile: parentProfile
            });

            console.log('Authenticated via parent frame');
          }
          break;
          
        case 'auth-error':
          console.error('Authentication error from parent:', data.error);
          toast({
            title: "Authentication Error",
            description: "Failed to authenticate with parent application.",
            variant: "destructive",
          });
          break;
          
        case 'iframe-pos':
          // Silently handle positioning messages - these are used by development tools
          break;
          
        default:
          // Only log warnings for unexpected message types from trusted origins
          if (!isKnownNonCriticalOrigin) {
            console.warn('Unknown message type:', data.type);
          }
          break;
      }
    };

    // Set up the event listener
    window.addEventListener('message', handleAuthMessage);
    
    // Request authentication from parent frame
    if (isInIframe) {
      window.parent.postMessage({ type: 'request-auth' }, '*');
    }

    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [isInIframe, trustedOrigins]);

  return { iframeAuth, isInIframe };
}
