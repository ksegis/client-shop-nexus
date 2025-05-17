
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AnomalyParams {
  user_id: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request to get userId
    const { user_id } = await req.json() as AnomalyParams;
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all sessions for this user
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('last_active', { ascending: false });

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    // Simple anomaly detection logic (can be expanded)
    const anomalies = {
      multipleBrowsers: false,
      multipleLocations: false,
      recentActivities: [],
      suspiciousSessions: [],
    };
    
    // Check for multiple browsers
    const browsers = new Set();
    sessions?.forEach(session => {
      // Simple browser detection from user agent
      const userAgent = session.user_agent || '';
      let browser = 'Unknown';
      
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) browser = 'Internet Explorer';
      
      browsers.add(browser);
      
      // Add recent activities
      anomalies.recentActivities.push({
        sessionId: session.id,
        lastActive: session.last_active,
        browser,
        ipAddress: session.ip_address || 'Unknown'
      });
    });
    
    anomalies.multipleBrowsers = browsers.size > 1;
    
    // Check for multiple locations (simplified)
    // In a real implementation, you might use IP geolocation
    const ips = new Set(sessions?.map(s => s.ip_address).filter(Boolean));
    anomalies.multipleLocations = ips.size > 1;

    // Flag potentially suspicious sessions
    anomalies.suspiciousSessions = sessions
      ?.filter(session => {
        const lastActive = new Date(session.last_active);
        const now = new Date();
        // Consider sessions not active in last 30 days as suspicious
        return (now.getTime() - lastActive.getTime()) > (30 * 24 * 60 * 60 * 1000);
      })
      .map(session => ({
        id: session.id,
        lastActive: session.last_active,
        ipAddress: session.ip_address || 'Unknown',
        userAgent: session.user_agent
      }));

    return new Response(
      JSON.stringify(anomalies),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
