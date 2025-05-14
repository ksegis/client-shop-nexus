
import { createClient } from '@supabase/supabase-js';

// Hardcode the values directly since they're already public in .env.example
const supabaseUrl = 'https://vqkxrbflwhunvbotjdds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3hyYmZsd2h1bnZib3RqZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5ODc4ODksImV4cCI6MjA2MjU2Mzg4OX0.9cDur61j55TrjPY3SDDW4EHKGWjReC8Vk5eaojC4_sk';

// Ensure we have valid values
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anonymous Key. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'custom_truck_connection_auth',
    storage: localStorage,
  },
  global: {
    headers: {
      'x-application-name': 'custom-truck-connection',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export a helper to safely check connection state
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch (e) {
    console.error('Supabase connection check failed:', e);
    return false;
  }
};

// Helper to check authentication status
export const isAuthenticated = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (e) {
    console.error('Auth check failed:', e);
    return false;
  }
};

// Helper to check current user's role
export const getUserRole = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error || !data) return null;
    return data.role;
  } catch (e) {
    console.error('Role check failed:', e);
    return null;
  }
};

// Helper to check if current user is admin
export const isUserAdmin = async () => {
  const role = await getUserRole();
  return role === 'admin';
};

// Helper for error handling with RLS policies
export const handleRlsError = (error: any, toast: any) => {
  console.error('Database operation failed:', error);
  
  if (error?.message?.includes('new row violates row-level security policy')) {
    toast({
      title: "Permission Denied",
      description: "You don't have permission to perform this action. This may be due to Row Level Security restrictions.",
      variant: "destructive",
    });
    return true;
  }
  
  toast({
    title: "Operation Failed",
    description: error?.message || "An unknown error occurred",
    variant: "destructive",
  });
  return false;
};
