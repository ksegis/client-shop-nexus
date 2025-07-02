
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
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the caller is an admin
    const { data: { user: adminUser }, error: authError } = await supabaseAdmin.auth.getUser()
    if (authError || !adminUser) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single()
      
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to verify admin privileges' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (profile?.role !== 'admin') {
      console.error('Not an admin:', profile);
      return new Response(JSON.stringify({ error: 'Admin privileges required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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
    
    const { user_id } = body;
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch the user info first to get their email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userError || !userData?.user?.email) {
      console.error('User fetch error:', userError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user information' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate an impersonation token for the specified user
    const { data: impersonateData, error: impersonateError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    })

    if (impersonateError || !impersonateData) {
      console.error('Impersonation error:', impersonateError);
      return new Response(JSON.stringify({ error: 'Failed to generate impersonation token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Return the temporary token
    return new Response(JSON.stringify({
      access_token: impersonateData.properties?.access_token,
      refresh_token: impersonateData.properties?.refresh_token
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
