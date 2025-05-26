
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured. Please contact administrator.' 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    // Create the invitation URL - using the current preview URL
    const inviteUrl = `https://id-preview--6dd8b04d-be77-46f2-b1a0-1037f4165d18.lovable.app/auth/invite-accept?token=${token}`;
    
    console.log('Invitation URL generated:', inviteUrl);

    // Create email content
    const emailSubject = `You've been invited to join ModWorx as ${role}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>ModWorx Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              background-color: #007bff; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0; 
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ModWorx!</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName} ${lastName},</p>
              <p>You have been invited to join ModWorx with the role of <strong>${role}</strong>.</p>
              <p>To complete your account setup, please click the button below:</p>
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${inviteUrl}</p>
              <p><strong>Important:</strong> This invitation link will expire in 36 hours.</p>
              <p>If you have any questions, please contact your administrator.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>If you did not expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email using your verified domain
    console.log('Attempting to send email via Resend...');
    const emailResult = await resend.emails.send({
      from: 'ModWorx System <noreply@modworx.online>',
      to: [email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log('Resend API response:', emailResult);

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send invitation email: ' + emailResult.error.message,
          details: emailResult.error,
          inviteUrl // Still return the URL for manual sharing
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Email sent successfully. Email ID:', emailResult.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation email sent successfully to ${email}`,
        emailId: emailResult.data?.id,
        inviteUrl // Return URL for admin reference
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
