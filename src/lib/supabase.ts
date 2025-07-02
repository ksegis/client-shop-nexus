// Enhanced Supabase Client - Prevents multiple instances and tracks creation
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global tracking to prevent any duplicate clients
const GLOBAL_SUPABASE_KEY = '__GLOBAL_SUPABASE_CLIENT__';

class EnhancedSupabaseClientManager {
  private static instance: SupabaseClient | null = null;
  private static isInitialized = false;
  private static creationStack: string[] = [];
  private static instanceCount = 0;

  public static getInstance(): SupabaseClient {
    // Check if there's already a global instance
    if ((window as any)[GLOBAL_SUPABASE_KEY]) {
      console.log('[Supabase] Using existing global instance');
      return (window as any)[GLOBAL_SUPABASE_KEY];
    }

    if (!this.instance) {
      this.instance = this.createClient();
      this.isInitialized = true;
      
      // Store globally to prevent any other instances
      (window as any)[GLOBAL_SUPABASE_KEY] = this.instance;
      
      console.log('Supabase client initialized (singleton) - Instance #', ++this.instanceCount);
      
      // Track creation stack
      const stack = new Error().stack;
      if (stack) {
        this.creationStack.push(stack);
        console.log('[Supabase] Client created from:', stack.split('\n')[2]);
      }
    }
    return this.instance;
  }

  private static createClient(): SupabaseClient {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_TOKEN environment variables.');
    }

    // Enhanced client configuration to prevent multiple auth instances
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Use a unique storage key to prevent conflicts
        storageKey: 'sb-auth-token-singleton',
        // Disable auto-refresh if multiple instances detected
        autoRefreshToken: this.instanceCount === 0
      },
      // Add global configuration to prevent multiple instances
      global: {
        headers: {
          'X-Client-Instance': 'singleton'
        }
      }
    });
  }

  // Method to check if client is initialized
  public static isClientInitialized(): boolean {
    return this.isInitialized && this.instance !== null;
  }

  // Method to get client configuration info (for debugging)
  public static getClientInfo(): { 
    url?: string; 
    isInitialized: boolean; 
    instanceCount: number;
    creationStacks: string[];
    hasGlobalInstance: boolean;
  } {
    return {
      url: import.meta.env.VITE_SUPABASE_URL,
      isInitialized: this.isInitialized,
      instanceCount: this.instanceCount,
      creationStacks: this.creationStack,
      hasGlobalInstance: !!(window as any)[GLOBAL_SUPABASE_KEY]
    };
  }

  // Method to force reset (for debugging)
  public static reset(): void {
    console.warn('[Supabase] Forcing client reset');
    this.instance = null;
    this.isInitialized = false;
    this.creationStack = [];
    delete (window as any)[GLOBAL_SUPABASE_KEY];
  }

  // Method to detect and prevent multiple instances
  public static detectMultipleInstances(): boolean {
    const hasMultiple = this.instanceCount > 1 || 
                       (window as any)[GLOBAL_SUPABASE_KEY] !== this.instance;
    
    if (hasMultiple) {
      console.error('[Supabase] Multiple instances detected!');
      console.log('Instance count:', this.instanceCount);
      console.log('Creation stacks:', this.creationStack);
      console.log('Global instance exists:', !!(window as any)[GLOBAL_SUPABASE_KEY]);
      console.log('Global instance matches:', (window as any)[GLOBAL_SUPABASE_KEY] === this.instance);
    }
    
    return hasMultiple;
  }
}

// Override the global createClient to prevent external creation
const originalCreateClient = createClient;
let createClientCallCount = 0;

// Monkey patch createClient to track all calls
(window as any).createClient = (...args: any[]) => {
  createClientCallCount++;
  console.warn(`[Supabase] External createClient call #${createClientCallCount} detected!`);
  console.trace('[Supabase] External createClient stack trace:');
  
  // If this is not our singleton call, return the singleton instead
  if (createClientCallCount > 1) {
    console.warn('[Supabase] Redirecting external createClient to singleton');
    return EnhancedSupabaseClientManager.getInstance();
  }
  
  return originalCreateClient(...args);
};

// Safe array access for Supabase responses
export const safeSupabaseResponse = <T>(
  response: { data: T[] | null; error: any } | null,
  componentName: string = 'unknown'
): T[] => {
  if (!response) {
    console.warn(`[SafeSupabase] ${componentName}: Response is null, returning empty array`);
    return [];
  }
  
  if (response.error) {
    console.warn(`[SafeSupabase] ${componentName}: Error in response:`, response.error);
    return [];
  }
  
  if (!Array.isArray(response.data)) {
    console.warn(`[SafeSupabase] ${componentName}: Data is not an array:`, response.data);
    return [];
  }
  
  return response.data;
};

// Safe Supabase query wrapper
export const safeSupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T[] | null; error: any }>,
  componentName: string = 'unknown',
  fallback: T[] = []
): Promise<T[]> => {
  try {
    const response = await queryFn();
    return safeSupabaseResponse(response, componentName);
  } catch (error) {
    console.error(`[SafeSupabase] ${componentName}: Query failed:`, error);
    return fallback;
  }
};

// Export the singleton instance getter
export const getSupabaseClient = (): SupabaseClient => {
  return EnhancedSupabaseClientManager.getInstance();
};

// Export client info for debugging
export const getSupabaseClientInfo = () => {
  return EnhancedSupabaseClientManager.getClientInfo();
};

// Export debugging utilities
export const debugSupabaseInstances = () => {
  console.log('=== SUPABASE INSTANCE DEBUG ===');
  console.log('Client Info:', EnhancedSupabaseClientManager.getClientInfo());
  console.log('Multiple Instances Detected:', EnhancedSupabaseClientManager.detectMultipleInstances());
  console.log('External createClient calls:', createClientCallCount);
  console.log('Global instance exists:', !!(window as any)[GLOBAL_SUPABASE_KEY]);
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).debugSupabaseInstances = debugSupabaseInstances;
  (window as any).resetSupabaseClient = () => EnhancedSupabaseClientManager.reset();
  (window as any).getSupabaseClientInfo = getSupabaseClientInfo;
}

// Default export for convenience
export default getSupabaseClient;

