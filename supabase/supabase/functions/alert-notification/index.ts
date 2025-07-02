
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the alert data from the request body
    const { record } = await req.json();
    
    if (!record || !record.user_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data, missing record or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user email from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', record.user_id)
      .single();
    
    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found', details: profileError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the security alert information
    console.log('Security alert processed:', {
      alertId: record.id,
      alertType: record.alert_type,
      userEmail: profile.email,
      timestamp: new Date().toISOString()
    });
    
    // Update the alert to mark that it was processed
    await supabase
      .from('security_alerts')
      .update({ 
        metadata: { 
          ...record.metadata, 
          processed: true, 
          processed_at: new Date().toISOString() 
        } 
      })
      .eq('id', record.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Alert processed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in alert-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
