
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from './cors.ts';
import { sendNotificationEmail } from './email-service.ts';

interface NotificationRequest {
  to: string;
  subject: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
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
    const notificationData: NotificationRequest = await req.json();
    
    console.log('Processing notification email for:', notificationData.to);

    const emailResult = await sendNotificationEmail(notificationData);

    if (emailResult.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notification email sent successfully',
          messageId: emailResult.messageId
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResult.error
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
