
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function can be called manually or set up with a webhook trigger
// to automatically send notifications when new security alerts are created
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
    const { record, type } = await req.json();
    
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

    // Format metadata for email
    let metadataText = '';
    if (record.metadata) {
      try {
        const metadata = typeof record.metadata === 'string' 
          ? JSON.parse(record.metadata) 
          : record.metadata;
        
        metadataText = Object.entries(metadata)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      } catch (e) {
        metadataText = String(record.metadata);
      }
    }

    // Get alert type in a more human-readable format
    const alertTypeMap = {
      'new_device': 'New Device Login',
      'impossible_travel': 'Login from Unusual Location',
      'multiple_failures': 'Multiple Failed Login Attempts'
    };
    
    const alertTitle = alertTypeMap[record.alert_type as keyof typeof alertTypeMap] || record.alert_type;
    
    // Send the email notification
    // Note: We'll use a placeholder here - you'll need to replace with your actual email service
    console.log('Would send email to:', profile.email);
    console.log('Subject:', `Security Alert: ${alertTitle}`);
    console.log('Message:', `
      A security alert has been triggered for your account.
      
      Alert Type: ${alertTitle}
      Time: ${new Date(record.created_at).toLocaleString()}
      
      Details:
      ${metadataText}
      
      If this wasn't you, please secure your account immediately by changing your password.
    `);
    
    // Replace with your actual email sending logic
    // This could use Resend, SendGrid, or any other email service
    // Example (commented out):
    /*
    const emailResponse = await fetch('https://api.email-service.com/send', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('EMAIL_API_KEY')}` 
      },
      body: JSON.stringify({
        to: profile.email,
        subject: `Security Alert: ${alertTitle}`,
        text: `
          A security alert has been triggered for your account.
          
          Alert Type: ${alertTitle}
          Time: ${new Date(record.created_at).toLocaleString()}
          
          Details:
          ${metadataText}
          
          If this wasn't you, please secure your account immediately by changing your password.
        `
      })
    });
    
    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${await emailResponse.text()}`);
    }
    */
    
    // For now we'll just log and return success
    console.log('Alert notification processed for:', record.id);
    
    // Update the alert to mark that a notification was sent
    await supabase
      .from('security_alerts')
      .update({ 
        metadata: { 
          ...record.metadata, 
          notification_sent: true, 
          notification_time: new Date().toISOString() 
        } 
      })
      .eq('id', record.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Alert notification processed' }),
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
