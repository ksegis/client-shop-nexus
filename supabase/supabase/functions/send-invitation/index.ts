
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, handleCorsPreflightRequest } from './cors.ts';
import { processInvitation } from './invitation-service.ts';
import { handleError, handleMethodNotAllowed } from './error-handler.ts';
import type { InvitationRequest } from './types.ts';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  if (req.method !== 'POST') {
    return handleMethodNotAllowed();
  }

  try {
    const invitationRequest: InvitationRequest = await req.json();
    const result = await processInvitation(invitationRequest);

    return new Response(
      JSON.stringify(result), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    return handleError(error);
  }
};

serve(handler);
