
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";
import { generateRegistrationOptions } from "https://esm.sh/@simplewebauthn/server@7.2.0";
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
    const { user_id, device_name } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get existing authenticators
    const { data: authenticators, error: fetchError } = await supabaseClient
      .from('user_authenticators')
      .select('credential_id')
      .eq('user_id', user_id);
    
    if (fetchError) {
      console.error("Error fetching authenticators:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch existing authenticators" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Generate challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const challengeBase64 = arrayBufferToBase64(challenge.buffer);
    
    // Store the challenge in the database for verification later
    const { error: challengeError } = await supabaseClient
      .from('webauthn_challenges')
      .insert({
        user_id: user_id,
        challenge: challengeBase64,
        type: 'registration',
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
    
    // Get the current hostname for the RP ID
    // In production, make sure this is set correctly for your domain
    const rpID = Deno.env.get("RP_ID") || new URL(req.url).hostname;

    // Generate registration options
    const options = {
      challenge,
      rp: {
        name: "Auto Shop Management",
        id: rpID
      },
      user: {
        id: Uint8Array.from(user_id, c => c.charCodeAt(0)),
        name: user_id,
        displayName: device_name || "Security Key"
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      timeout: 60000,
      attestation: "none",
      authenticatorSelection: {
        userVerification: "preferred",
        residentKey: "preferred",
        requireResidentKey: false
      },
      excludeCredentials: authenticators?.map(auth => ({
        id: Uint8Array.from(atob(auth.credential_id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        type: "public-key"
      })) || []
    };

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
    console.error("Error in WebAuthn registration options function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
