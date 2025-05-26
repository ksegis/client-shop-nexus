
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    console.log('Sending invitation to:', email, 'Role:', role);

    // For now, we'll just log the invitation details
    // In a real implementation, you would integrate with an email service like Resend
    const inviteUrl = `${Deno.env.get('SUPABASE_URL')?.replace('//', '//').replace('supabase.co', 'lovable.app')}/auth/invite-accept?token=${token}`;
    
    console.log('Invitation details:', {
      to: email,
      firstName,
      lastName,
      role,
      inviteUrl,
      expiresIn: '36 hours'
    });

    // TODO: Integrate with email service (e.g., Resend)
    // For now, we'll return success to allow testing
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation logged (email service integration needed)',
        inviteUrl // Return URL for testing purposes
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
