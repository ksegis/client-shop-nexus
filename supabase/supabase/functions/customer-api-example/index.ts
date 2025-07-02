
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface ApiKeyValidationResult {
  isValid: boolean;
  customerId?: string;
  keyName?: string;
  error?: string;
}

const validateApiKey = async (supabase: any, apiKey: string): Promise<ApiKeyValidationResult> => {
  if (!apiKey) {
    return { isValid: false, error: 'API key is required' };
  }

  if (!apiKey.startsWith('ctc_') || apiKey.length !== 68) {
    return { isValid: false, error: 'Invalid API key format' };
  }

  try {
    const { data, error } = await supabase
      .from('customer_api_keys')
      .select('customer_id, key_name, is_active, expires_at')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { isValid: false, error: 'Invalid API key' };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { isValid: false, error: 'API key has expired' };
    }

    // Update last used timestamp
    await supabase
      .from('customer_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('api_key', apiKey);

    return {
      isValid: true,
      customerId: data.customer_id,
      keyName: data.key_name
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { isValid: false, error: 'Failed to validate API key' };
  }
};

const extractApiKey = (request: Request): string | null => {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  const url = new URL(request.url);
  const apiKeyParam = url.searchParams.get('api_key');
  if (apiKeyParam) {
    return apiKeyParam;
  }

  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract API key from request
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate API key
    const validation = await validateApiKey(supabaseClient, apiKey);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // API key is valid, proceed with the actual logic
    // Example: Get customer's work orders
    const { data: workOrders, error } = await supabaseClient
      .from('work_orders')
      .select(`
        id,
        title,
        description,
        status,
        created_at,
        vehicles (make, model, year)
      `)
      .eq('customer_id', validation.customerId)
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch work orders' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: workOrders,
        keyName: validation.keyName 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
