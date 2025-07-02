import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vqkxrbflwhunvbotjdds.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3hyYmZsd2h1bnZib3RqZGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5ODc4ODksImV4cCI6MjA2MjU2Mzg4OX0.9cDur61j55TrjPY3SDDW4EHKGWjReC8Vk5eaojC4_sk'

// Global client instance storage
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient
  }
}

// Create single global Supabase client instance
function createSupabaseClient(): SupabaseClient {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // Return existing instance if already created
    if (window.__supabaseClient) {
      return window.__supabaseClient
    }
    
    // Create new instance and store globally
    window.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    
    console.log('Supabase client initialized')
    return window.__supabaseClient
  }
  
  // SSR fallback - create temporary instance
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
}

// Export single global instance
export const supabase = createSupabaseClient()

// Export compatibility function for existing code
export const getSupabaseClient = () => supabase

