
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use the direct URLs instead of environment variables since Lovable doesn't support VITE_* variables
const supabaseUrl = 'https://vqkxrbflwhunvbotjdds.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3hyYmZsd2h1bnZib3RqZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5ODc4ODksImV4cCI6MjA2MjU2Mzg4OX0.9cDur61j55TrjPY3SDDW4EHKGWjReC8Vk5eaojC4_sk';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce'
  }
});

// Helper function to handle auth errors
export const handleAuthError = (error: any) => {
  console.error('Supabase Auth Error:', error);
  
  // Log to Sentry if available
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error);
  }
  
  // Return user-friendly error message
  switch (error?.message) {
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link before trying to reset your password.';
    case 'Invalid token':
    case 'Token has expired':
      return 'This password reset link has expired. Please request a new one.';
    case 'User not found':
      return 'No account found with this email address.';
    default:
      return error?.message || 'An unexpected error occurred. Please try again.';
  }
};

// Auth event logging function for debugging
export const logAuthEvent = async (eventType: string, userId?: string | null, metadata: Record<string, any> = {}) => {
  try {
    console.log(`[Supabase Auth] ${eventType}`, { userId, ...metadata });
    
    // Override any EGIS logging
    if (eventType.includes('EGIS')) {
      console.warn('[Supabase Auth] Blocking EGIS auth event:', eventType);
      return;
    }
  } catch (error) {
    console.error('[Supabase Auth] Logging error:', error);
  }
};
