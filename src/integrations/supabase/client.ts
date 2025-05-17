
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import type { Database } from './types';

// Configure the Supabase client
const supabaseUrl = 'https://vqkxrbflwhunvbotjdds.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3hyYmZsd2h1bnZib3RqZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5ODc4ODksImV4cCI6MjA2MjU2Mzg4OX0.9cDur61j55TrjPY3SDDW4EHKGWjReC8Vk5eaojC4_sk';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to handle RLS errors more gracefully
export const handleRlsError = (
  error: any, 
  toast: ReturnType<typeof useToast>['toast']
) => {
  if (error.message?.includes('new row violates row-level security policy') || 
      error.message?.includes('permission denied')) {
    console.error('RLS Policy Violation:', error);
    toast({
      title: "Permission Error",
      description: "You don't have permission to perform this action. This is likely due to Row Level Security (RLS) policies.",
      variant: "destructive",
    });
    return true;
  }
  
  if (error.message?.includes('JWT')) {
    console.error('Authentication Error:', error);
    toast({
      title: "Authentication Error",
      description: "Your session has expired or is invalid. Please log in again.",
      variant: "destructive",
    });
    return true;
  }
  
  return false;
};

// Auth event logging function
export const logAuthEvent = async (eventType: string, userId?: string | null, metadata: Record<string, any> = {}) => {
  try {
    console.log(`Logging auth event: ${eventType}`, { userId, ...metadata });
    
    // Log to auth_flow_logs table if it exists
    try {
      const { error } = await supabase.from('auth_flow_logs').insert({
        event_type: eventType,
        user_id: userId || null,
        details: metadata,
        client_timestamp: new Date().toISOString()
      });
      
      if (error) {
        console.error('Error logging auth event:', error);
      }
    } catch (err) {
      // Silently catch if auth_flow_logs table doesn't exist or other errors
      console.warn('Could not log auth event to database:', err);
    }
  } catch (error) {
    console.error('Auth logging error:', error);
  }
};
