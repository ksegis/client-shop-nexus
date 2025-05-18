
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import { verifyAuthenticationResponse } from "https://esm.sh/@simplewebauthn/server@7.2.0";
import { base64ToArrayBuffer } from "../shared/webauthn-utils.ts";

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
    const { userId, assertion, challengeId } = await req.json();
    
    if (!assertion || !challengeId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // First, let's find the credential being used
    const { data: authenticatorData, error: credentialError } = await supabaseClient
      .from('user_authenticators')
      .select('credential_id, public_key, user_id')
      .eq('credential_id', assertion.id)
      .single();

    if (credentialError || !authenticatorData) {
      console.error("Credential not found:", credentialError);
      return new Response(
        JSON.stringify({ error: "Credential not found", details: credentialError }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // If userId is provided, verify that it matches the credential's user
    if (userId && userId !== authenticatorData.user_id) {
      return new Response(
        JSON.stringify({ error: "User ID does not match credential owner" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get the challenge from the database
    const { data: challengeData, error: challengeError } = await supabaseClient
      .from('webauthn_challenges')
      .select('challenge, type')
      .eq('challenge', challengeId)
      .eq('type', 'authentication')
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (challengeError || !challengeData) {
      console.error("Challenge not found or expired:", challengeError);
      return new Response(
        JSON.stringify({ error: "Challenge not found or expired" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get the RP ID for the environment
    const rpID = Deno.env.get("RP_ID") || new URL(req.url).hostname;
    const expectedOrigin = Deno.env.get("EXPECTED_ORIGIN") || `https://${rpID}`;

    // Verify the authentication
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: base64ToArrayBuffer(authenticatorData.credential_id),
        credentialPublicKey: base64ToArrayBuffer(authenticatorData.public_key),
        counter: 0, // We're not tracking counters in this simple implementation
      },
      requireUserVerification: false
    });

    if (verification.verified) {
      // Update the last_used_at timestamp
      await supabaseClient
        .from('user_authenticators')
        .update({ last_used_at: new Date().toISOString() })
        .eq('credential_id', assertion.id);

      // Clean up the used challenge
      await supabaseClient
        .from('webauthn_challenges')
        .delete()
        .eq('challenge', challengeId);

      return new Response(
        JSON.stringify({ 
          verified: true,
          user_id: authenticatorData.user_id 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: "Authentication verification failed" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("Error in WebAuthn authentication verification function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
