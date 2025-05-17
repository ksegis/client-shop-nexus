
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/hooks/useSecurityDashboard';

export default function SimpleDashboard() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['security-alerts-simple'],
    queryFn: async () => {
      // First fetch security alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      
      if (alertsError) {
        console.error("Error fetching security alerts:", alertsError);
        return [] as Alert[];
      }

      // Get unique user IDs from alerts to fetch profiles
      const userIds = [...new Set(alertsData?.map(alert => alert.user_id) || [])];
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return alertsData || [];
      }
      
      // Create a map of user_id -> profile for quick lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Join alerts with profile data
      return alertsData?.map(alert => ({
        ...alert,
        profiles: profileMap.get(alert.user_id) || { email: 'Unknown' }
      })) || [];
    }
  });

  if (isLoading) {
    return <div>Loading security alerts...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Active Security Alerts</h2>
      {alerts && alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.map(alert => (
            <li key={alert.id} className="p-2 border rounded">
              {alert.profiles?.email || 'Unknown user'} - {alert.alert_type}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No active security alerts</p>
      )}
    </div>
  );
}
