
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

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

    // Get the request body
    const { p_user_id, p_challenge, p_type, p_expires_at } = await req.json();
    
    // Validate inputs
    if (!p_user_id || !p_challenge || !p_type || !p_expires_at) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Insert the challenge directly to avoid RPC issues
    const { error } = await supabaseClient
      .from('webauthn_challenges')
      .insert({
        user_id: p_user_id,
        challenge: p_challenge,
        type: p_type,
        expires_at: p_expires_at
      });
    
    if (error) {
      console.error("Error storing WebAuthn challenge:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store challenge" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in WebAuthn challenge function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
