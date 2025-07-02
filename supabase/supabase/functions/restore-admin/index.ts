
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
async function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = await handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('JSON parse error:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const { admin_id } = body;
    if (!admin_id) {
      return new Response(JSON.stringify({ error: 'Admin ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Verify this is an admin account
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', admin_id)
      .single()
      
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to verify admin account' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
      
    if (profile?.role !== 'admin') {
      console.error('Not an admin account:', profile);
      return new Response(JSON.stringify({ error: 'Admin account required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate a link for the admin user to restore their session
    const { data: adminUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(admin_id);
    if (userError || !adminUser?.user?.email) {
      console.error('Admin user fetch error:', userError);
      return new Response(JSON.stringify({ error: 'Admin email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.user.email,
    })

    if (linkError || !linkData) {
      console.error('Failed to generate admin token:', linkError);
      return new Response(JSON.stringify({ error: 'Failed to restore admin session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Return the admin tokens
    return new Response(JSON.stringify({
      access_token: linkData.properties?.access_token,
      refresh_token: linkData.properties?.refresh_token
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
