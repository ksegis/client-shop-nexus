import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface Alert {
  id: string;
  alert_type: string;
  created_at: string;
  metadata: any;
  resolved_at: string | null;
  user_id: string;
  profiles?: {
    email: string;
  };
}

export interface SecurityStat {
  user_id: string;
  email: string;
  devices: number;
  active_alerts: number;
}

export function useSecurityDashboard() {
  const { toast } = useToast();
  
  // Query for active security alerts
  const { 
    data: alerts = [], 
    isLoading: alertsLoading, 
    refetch: refetchAlerts 
  } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      // First fetch security alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      
      if (alertsError) {
        console.error("Error fetching security alerts:", alertsError);
        toast({
          title: "Error fetching security alerts",
          description: alertsError.message,
          variant: "destructive"
        });
        return [] as Alert[];
      }

      // If there are no alerts, return empty array
      if (!alertsData || alertsData.length === 0) {
        return [] as Alert[];
      }

      // Get unique user IDs from alerts to fetch profiles
      const userIds = [...new Set(alertsData.map(alert => alert.user_id))];
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        // Return alerts without profile info if there's an error
        return alertsData as Alert[];
      }
      
      // Create a map of user_id -> profile for quick lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Join alerts with profile data
      return alertsData.map(alert => ({
        ...alert,
        profiles: profileMap.get(alert.user_id) || { email: 'Unknown' }
      })) as Alert[];
    }
  });

  // Query for security stats
  const { 
    data: securityStats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['security-stats'],
    queryFn: async () => {
      try {
        // First get all users
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, email')
          .order('email');
        
        if (usersError) throw usersError;
        if (!users) return [] as SecurityStat[];
        
        // Process each user to get their sessions and alerts
        const userStats = await Promise.all(users.map(async (user) => {
          // Get user sessions to count devices
          const { data: sessions } = await supabase
            .from('user_sessions')
            .select('device_hash')
            .eq('user_id', user.id);
            
          // Get user alerts to count active alerts
          const { data: userAlerts } = await supabase
            .from('security_alerts')
            .select('id, resolved_at')
            .eq('user_id', user.id);
            
          // Calculate stats
          const uniqueDevices = new Set(sessions?.map(s => s.device_hash) || []);
          const activeAlerts = userAlerts?.filter(a => a.resolved_at === null).length || 0;
          
          return {
            user_id: user.id,
            email: user.email,
            devices: uniqueDevices.size,
            active_alerts: activeAlerts
          } as SecurityStat;
        }));
        
        return userStats;
      } catch (error: any) {
        console.error("Error fetching security stats:", error);
        toast({
          title: "Error fetching security statistics",
          description: error.message,
          variant: "destructive"
        });
        return [] as SecurityStat[];
      }
    }
  });

  // Function to resolve alerts
  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alertId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Alert resolved",
        description: "The security alert has been marked as resolved",
      });
      
      // Refetch alerts to update the list
      refetchAlerts();
      return true;
    } catch (error: any) {
      toast({
        title: "Error resolving alert",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    alerts,
    alertsLoading,
    securityStats,
    statsLoading,
    resolveAlert,
    refetchAlerts
  };
}
