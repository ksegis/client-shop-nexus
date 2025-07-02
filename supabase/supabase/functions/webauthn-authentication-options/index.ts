
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import { generateAuthenticationOptions } from "https://esm.sh/@simplewebauthn/server@7.2.0";
import { arrayBufferToBase64 } from "../shared/webauthn-utils.ts";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get request body
    const { user_id } = await req.json();

    // If no user_id provided, handle conditional UI (passkeys)
    let authenticators = [];
    
    if (user_id) {
      // Get existing authenticators for this user
      const { data, error } = await supabaseClient
        .from('user_authenticators')
        .select('credential_id')
        .eq('user_id', user_id);
      
      if (error) {
        console.error("Error fetching authenticators:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch authenticators" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
      
      authenticators = data || [];
    }
    
    // Generate challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const challengeBase64 = arrayBufferToBase64(challenge.buffer);
    
    // Store the challenge in the database for verification later
    // If user_id is provided, associate the challenge with the user
    if (user_id) {
      const { error: challengeError } = await supabaseClient
        .from('webauthn_challenges')
        .insert({
          user_id: user_id,
          challenge: challengeBase64,
          type: 'authentication',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiry
        });
      
      if (challengeError) {
        console.error("Error storing challenge:", challengeError);
        return new Response(
          JSON.stringify({ error: "Failed to create authentication challenge" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }
    
    // Get the current hostname for the RP ID
    const rpID = Deno.env.get("RP_ID") || new URL(req.url).hostname;
    
    // Generate authentication options
    const options = generateAuthenticationOptions({
      // Convert stored credential IDs to the required format
      allowCredentials: authenticators.map((auth) => ({
        id: Uint8Array.from(atob(auth.credential_id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        type: 'public-key'
      })),
      userVerification: 'preferred',
      timeout: 60000,
      challenge
    });

    return new Response(
      JSON.stringify({ 
        options,
        challengeId: challengeBase64
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in authentication options function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
