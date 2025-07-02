
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';

console.log('Adding public insert policy function started');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    // Create admin client to add policies
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse request body for parameters
    const { target_table } = await req.json();
    
    if (!target_table) {
      return new Response(
        JSON.stringify({ error: 'Target table name is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Execute queries to create policies
    const queries = [
      // Drop existing policies first if they exist
      `DROP POLICY IF EXISTS "Allow public insert access" ON public.${target_table};`,
      
      // Create public insert policy that allows authentication events to be logged from any session
      `CREATE POLICY "Allow public insert access" 
       ON public.${target_table}
       FOR INSERT 
       TO anon, authenticated
       WITH CHECK (true);`
    ];

    for (const query of queries) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Error adding public insert policy:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
