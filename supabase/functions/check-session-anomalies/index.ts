
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

    // Enhanced anomaly detection logic with additional checks
    const anomalies = {
      simultaneous_sessions: sessions?.length || 0,
      new_device: false,
      suspicious_location: false,
      recentActivities: [],
      suspiciousSessions: [],
    };
    
    // Check for multiple browsers
    const browsers = new Set();
    const ips = new Set();
    
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
      if (session.ip_address) {
        ips.add(session.ip_address);
      }
      
      // Add recent activities
      anomalies.recentActivities.push({
        sessionId: session.id,
        lastActive: session.last_active,
        browser,
        ipAddress: session.ip_address || 'Unknown'
      });
    });

    // Check for quick location changes (impossible travel)
    // This is a simplified check - in production you'd use geolocation data
    if (ips.size > 2 && sessions && sessions.length > 0) {
      // If more than 2 different IP addresses in active sessions, flag as suspicious
      anomalies.suspicious_location = true;
      
      // Add to security alerts if we detect impossible travel
      if (ips.size > 2) {
        try {
          await supabase.from('security_alerts').insert({
            user_id: user_id,
            alert_type: 'impossible_travel',
            metadata: {
              message: `Login from ${ips.size} different IP addresses within active sessions`,
              ip_addresses: Array.from(ips),
              timestamp: new Date().toISOString()
            }
          });
        } catch (alertError) {
          console.error('Failed to create impossible travel alert:', alertError);
        }
      }
    }
    
    // Compare current device with history
    const { data: deviceHistory } = await supabase
      .from('user_sessions')
      .select('device_hash')
      .eq('user_id', user_id)
      .order('last_active', { ascending: false });
    
    // If there's a current session and we can detect a new device
    if (sessions && sessions.length > 0 && deviceHistory && deviceHistory.length > 1) {
      const currentDevice = sessions[0].device_hash;
      const knownDevices = new Set(deviceHistory.map(h => h.device_hash));
      
      // If this is a new device not seen in the last 5 sessions
      if (!Array.from(knownDevices).slice(0, 5).includes(currentDevice)) {
        anomalies.new_device = true;
      }
    }

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
      JSON.stringify({
        simultaneous_sessions: anomalies.simultaneous_sessions, 
        new_device: anomalies.new_device,
        suspicious_location: anomalies.suspicious_location
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
