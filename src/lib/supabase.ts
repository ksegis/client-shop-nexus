// Shared Supabase Client - Single instance for the entire application
import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseClientManager {
  private static instance: SupabaseClient | null = null;
  private static isInitialized = false;

  public static getInstance(): SupabaseClient {
    if (!this.instance) {
      this.instance = this.createClient();
      this.isInitialized = true;
      console.log('Supabase client initialized (singleton)');
    }
    return this.instance;
  }

  private static createClient(): SupabaseClient {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_TOKEN environment variables.');
    }

    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  // Method to check if client is initialized
  public static isClientInitialized(): boolean {
    return this.isInitialized && this.instance !== null;
  }

  // Method to get client configuration info (for debugging)
  public static getClientInfo(): { url?: string; isInitialized: boolean } {
    return {
      url: import.meta.env.VITE_SUPABASE_URL,
      isInitialized: this.isInitialized
    };
  }
}

// Export the singleton instance getter
export const getSupabaseClient = (): SupabaseClient => {
  return SupabaseClientManager.getInstance();
};

// Export client info for debugging
export const getSupabaseClientInfo = () => {
  return SupabaseClientManager.getClientInfo();
};

// Default export for convenience
export default getSupabaseClient;
