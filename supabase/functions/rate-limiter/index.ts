
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration
const windowMs = 15 * 60 * 1000 // 15 minutes
const maxRequests = 10 // Maximum requests per window

// CORS headers for browser access
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Parse request body
    const { ip, path } = await req.json();
    
    if (!ip || !path) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ip and path' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Construct a unique key for this rate limit
    const rateLimitKey = `${path}:${ip}`;
    
    // Try to get an existing rate limit record
    const { data: existingData, error: selectError } = await supabase
      .from('rate_limits')
      .select('count, expires_at')
      .eq('key', rateLimitKey)
      .maybeSingle();
    
    if (selectError) {
      console.error('Error checking rate limit:', selectError);
      throw new Error('Failed to check rate limit');
    }
    
    let count = 1;
    let expiresAt = new Date(Date.now() + windowMs).toISOString();
    
    if (existingData) {
      // Check if the existing record has expired
      if (new Date(existingData.expires_at) < new Date()) {
        // Create a new rate limit period
        const { error: updateError } = await supabase
          .from('rate_limits')
          .update({ count: 1, expires_at: expiresAt, updated_at: new Date().toISOString() })
          .eq('key', rateLimitKey);
          
        if (updateError) {
          console.error('Error resetting rate limit:', updateError);
          throw new Error('Failed to reset rate limit');
        }
      } else {
        // Increment the existing count
        count = existingData.count + 1;
        expiresAt = existingData.expires_at;
        
        const { error: incrementError } = await supabase
          .from('rate_limits')
          .update({ count, updated_at: new Date().toISOString() })
          .eq('key', rateLimitKey);
          
        if (incrementError) {
          console.error('Error incrementing rate limit:', incrementError);
          throw new Error('Failed to update rate limit');
        }
      }
    } else {
      // Create a new rate limit record
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert([{ key: rateLimitKey, count, expires_at: expiresAt, updated_at: new Date().toISOString() }]);
        
      if (insertError) {
        console.error('Error creating rate limit:', insertError);
        throw new Error('Failed to create rate limit');
      }
    }
    
    // Check if rate limit exceeded
    if (count > maxRequests) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          retryAfter: expiresAt,
          limit: maxRequests,
          remaining: 0
        }),
        { 
          status: 429, 
          headers: {
            ...corsHeaders,
            'Retry-After': Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // Return success response with rate limit info
    return new Response(
      JSON.stringify({
        success: true,
        limit: maxRequests,
        remaining: maxRequests - count,
        reset: expiresAt,
      }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Rate limiter error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Rate limit processing failed' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
