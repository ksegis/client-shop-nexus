
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handleCorsPreflightRequest = (): Response => {
  return new Response(null, { headers: corsHeaders });
};
