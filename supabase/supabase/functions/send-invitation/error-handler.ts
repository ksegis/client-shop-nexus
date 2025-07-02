
import { corsHeaders } from './cors.ts';

export const handleError = (error: any): Response => {
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
};

export const handleMethodNotAllowed = (): Response => {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};
