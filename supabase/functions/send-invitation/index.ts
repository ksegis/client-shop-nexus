
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, firstName, lastName, role, token }: InvitationRequest = await req.json();

    console.log('Processing invitation for:', email, 'Role:', role, 'Token:', token);

    // Create the invitation URL
    const inviteUrl = `https://id-preview--6dd8b04d-be77-46f2-b1a0-1037f4165d18.lovable.app/auth/invite-accept?token=${token}`;
    
    console.log('Invitation URL generated:', inviteUrl);

    // Return success with the invitation URL for manual sharing
    console.log('Invitation created successfully - email service disabled');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation created successfully for ${email}. Please share the invitation URL manually.`,
        inviteUrl,
        note: 'Email service is disabled. Please share the invitation URL manually with the user.'
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-invitation function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
