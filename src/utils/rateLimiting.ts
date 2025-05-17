
import { config } from '@/config';

/**
 * Checks rate limit status for the current IP and specified path
 * 
 * @param path - The API path or identifier to rate limit
 * @returns Rate limit status information including remaining requests and reset time
 */
export const checkRateLimit = async (path: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: string;
}> => {
  try {
    // Get client IP (simplified - use a proper IP detection method)
    const ip = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => 'unknown');

    // Build the URL for the rate-limiter edge function
    const functionsUrl = `${config.siteUrl ? config.siteUrl : 'https://vqkxrbflwhunvbotjdds.supabase.co'}/functions/v1`;
    
    // Call the rate-limiter edge function (ensure name matches what's in config.toml)
    const response = await fetch(`${functionsUrl}/rate-limiter`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify({ ip, path })
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // If this is a rate limit exceeded error, throw with specific format
      if (response.status === 429) {
        const retryTime = new Date(errorData.retryAfter).toLocaleTimeString();
        throw new Error(`Too many requests. Try again after ${retryTime}`);
      }
      
      throw new Error(errorData.error || 'Rate limit check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // Check if this is already a formatted error from our code
    if (error.message && error.message.includes('Too many requests')) {
      throw error; // Re-throw rate limit errors with our format
    }
    
    // Return a default object to allow the application to continue
    return {
      success: false,
      limit: 0,
      remaining: 0,
      reset: new Date(Date.now() + 60000).toISOString() // Default 1 minute
    };
  }
};
