
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/hooks/useSecurityDashboard';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldX, Bell } from 'lucide-react';

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
        .select('id, email, mfa_enabled')
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

  // Query for MFA statistics
  const { data: mfaStats, isLoading: mfaStatsLoading } = useQuery({
    queryKey: ['mfa-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('mfa_enabled')
        .not('role', 'eq', 'customer');
      
      if (error) {
        console.error("Error fetching MFA statistics:", error);
        return { total: 0, enabled: 0, percentage: 0 };
      }
      
      const total = data?.length || 0;
      const enabled = data?.filter(p => p.mfa_enabled)?.length || 0;
      const percentage = total > 0 ? Math.round((enabled / total) * 100) : 0;
      
      return { total, enabled, percentage };
    }
  });

  if (isLoading) {
    return <div>Loading security alerts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* MFA Statistics Card */}
      <div className="bg-white rounded-lg shadow p-4 border">
        <h3 className="text-lg font-medium mb-2 flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5 text-blue-500" />
          MFA Status
        </h3>
        
        {mfaStatsLoading ? (
          <div className="text-sm text-gray-500">Loading MFA statistics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Staff Accounts</div>
              <div className="text-xl font-bold">{mfaStats?.total || 0}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">MFA Enabled</div>
              <div className="text-xl font-bold">{mfaStats?.enabled || 0}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Coverage</div>
              <div className="text-xl font-bold">{mfaStats?.percentage || 0}%</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Active Alerts Card */}
      <div className="bg-white rounded-lg shadow p-4 border">
        <h3 className="text-lg font-medium mb-2 flex items-center">
          <Bell className="mr-2 h-5 w-5 text-amber-500" />
          Active Security Alerts
        </h3>
        {alerts && alerts.length > 0 ? (
          <ul className="space-y-2">
            {alerts.map(alert => (
              <li key={alert.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <span className="font-medium">{alert.profiles?.email || 'Unknown user'}</span>
                  <span className="mx-2">-</span>
                  <span className="text-gray-700">{alert.alert_type}</span>
                </div>
                <div>
                  {alert.profiles?.mfa_enabled ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      MFA Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <ShieldX className="mr-1 h-3 w-3" />
                      No MFA
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No active security alerts</p>
        )}
      </div>
    </div>
  );
}
