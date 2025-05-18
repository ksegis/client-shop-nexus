
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import { verifyRegistrationResponse } from "https://esm.sh/@simplewebauthn/server@7.2.0";
import { base64ToArrayBuffer, arrayBufferToBase64 } from "../shared/webauthn-utils.ts";

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
    const { userId, attestation, challengeId, deviceName } = await req.json();
    
    if (!userId || !attestation || !challengeId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get the stored challenge from the database
    const { data: challengeData, error: challengeError } = await supabaseClient
      .from('webauthn_challenges')
      .select('challenge, type')
      .eq('user_id', userId)
      .eq('challenge', challengeId)
      .eq('type', 'registration')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
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

    // Verify the registration
    const verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false // Make this configurable if needed
    });

    if (verification.verified && verification.registrationInfo) {
      // Store the credential
      const { error } = await supabaseClient
        .from('user_authenticators')
        .insert({
          user_id: userId,
          credential_id: arrayBufferToBase64(verification.registrationInfo.credentialID),
          public_key: arrayBufferToBase64(verification.registrationInfo.credentialPublicKey),
          device_name: deviceName || 'Security Key'
        });

      if (error) {
        console.error("Error storing credential:", error);
        return new Response(
          JSON.stringify({ error: "Failed to save authenticator" }),
          { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Clean up the used challenge
      await supabaseClient
        .from('webauthn_challenges')
        .delete()
        .eq('challenge', challengeId);

      return new Response(
        JSON.stringify({ 
          verified: true,
          credentialID: arrayBufferToBase64(verification.registrationInfo.credentialID)
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
          error: "Registration verification failed" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("Error in WebAuthn registration verification function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
