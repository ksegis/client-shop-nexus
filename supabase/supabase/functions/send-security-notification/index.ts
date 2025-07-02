
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define headers for CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { alertId } = await req.json();
    
    if (!alertId) {
      return new Response(
        JSON.stringify({ error: 'Alert ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the alert details
    const { data: alert, error: alertError } = await supabase
      .from('security_alerts')
      .select('*, profiles:user_id(email)')
      .eq('id', alertId)
      .single();
    
    if (alertError || !alert) {
      throw new Error(`Error fetching alert: ${alertError?.message || 'Alert not found'}`);
    }

    // Format the alert message based on alert type
    let subject = 'Security Alert';
    let body = 'A security event occurred on your account.';
    
    switch(alert.alert_type) {
      case 'new_device':
        subject = 'New Device Login Detected';
        body = `We detected a login from a new device. If this wasn't you, please secure your account immediately.`;
        break;
      case 'impossible_travel':
        subject = 'Suspicious Login Location Detected';
        body = `We detected logins from multiple locations in a short time period. If this wasn't you, please secure your account immediately.`;
        break;
      case 'multiple_failures':
        subject = 'Multiple Failed Login Attempts';
        body = `There were multiple failed login attempts on your account. If this wasn't you, please secure your account immediately.`;
        break;
      case 'recovery_code_used':
        subject = 'Account Recovery Code Used';
        body = `A recovery code was used to access your account. If this wasn't you, please secure your account immediately.`;
        break;
    }

    // In a real implementation, you would send an actual email here
    // For this example, we'll just log what would be sent
    console.log('Would send email:', {
      to: alert.profiles?.email,
      subject,
      body
    });

    // Update the alert to mark notification as sent
    await supabase
      .from('security_alerts')
      .update({ 
        metadata: { 
          ...alert.metadata, 
          notification_sent: true,
          notification_time: new Date().toISOString()
        }
      })
      .eq('id', alertId);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in send-security-notification:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
