
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
