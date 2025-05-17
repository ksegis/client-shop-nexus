
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
    
    // Use upsert to simplify the rate limiting logic
    const { data, error } = await supabase
      .from('rate_limits')
      .upsert(
        { 
          key: rateLimitKey, 
          count: 1, 
          expires_at: new Date(Date.now() + windowMs).toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'key', 
          ignoreDuplicates: false 
        }
      )
      .select('count, expires_at')
      .single()
      .catch(() => ({ 
        error: { message: 'Rate limit table not configured' } 
      }));

    if (error) {
      if (error.message.includes('relation "public.rate_limits"')) {
        return new Response(
          JSON.stringify({ error: 'Rate limiting not configured' }),
          { status: 501, headers: corsHeaders }
        );
      }
      
      console.error('Error checking rate limit:', error);
      throw new Error('Failed to check rate limit');
    }

    // If record exists but has expired, reset the count
    if (data && new Date(data.expires_at) < new Date()) {
      const newExpiresAt = new Date(Date.now() + windowMs).toISOString();
      const { error: resetError } = await supabase
        .from('rate_limits')
        .update({ 
          count: 1, 
          expires_at: newExpiresAt, 
          updated_at: new Date().toISOString() 
        })
        .eq('key', rateLimitKey);
        
      if (resetError) {
        console.error('Error resetting rate limit:', resetError);
        throw new Error('Failed to reset rate limit');
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          limit: maxRequests,
          remaining: maxRequests - 1,
          reset: newExpiresAt,
        }),
        { headers: corsHeaders }
      );
    }

    // If we've reached this point, we need to increment the counter
    if (data) {
      const newCount = data.count + 1;
      const { error: incrementError } = await supabase
        .from('rate_limits')
        .update({ 
          count: newCount, 
          updated_at: new Date().toISOString() 
        })
        .eq('key', rateLimitKey);
        
      if (incrementError) {
        console.error('Error incrementing rate limit:', incrementError);
        throw new Error('Failed to update rate limit');
      }
      
      // Check if rate limit exceeded
      if (newCount > maxRequests) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded', 
            retryAfter: data.expires_at,
            limit: maxRequests,
            remaining: 0
          }),
          { 
            status: 429, 
            headers: {
              ...corsHeaders,
              'Retry-After': Math.ceil((new Date(data.expires_at).getTime() - Date.now()) / 1000).toString()
            }
          }
        );
      }
      
      // Return success with updated count
      return new Response(
        JSON.stringify({
          success: true,
          limit: maxRequests,
          remaining: maxRequests - newCount,
          reset: data.expires_at,
        }),
        { headers: corsHeaders }
      );
    }
    
    // Return success response for new rate limit
    return new Response(
      JSON.stringify({
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: new Date(Date.now() + windowMs).toISOString(),
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
