
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSecurityDashboard() {
  const { toast } = useToast();
  
  // Query for active security alerts
  const { 
    data: alerts, 
    isLoading: alertsLoading, 
    refetch: refetchAlerts 
  } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*, profiles(email)')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching security alerts:", error);
        toast({
          title: "Error fetching security alerts",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || [];
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
        
        // Process each user to get their sessions and alerts
        const userStats = await Promise.all((users || []).map(async (user) => {
          // Get user sessions
          const { data: sessions } = await supabase
            .from('user_sessions')
            .select('device_hash')
            .eq('user_id', user.id);
            
          // Get user alerts
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
          };
        }));
        
        return userStats;
      } catch (error: any) {
        console.error("Error fetching security stats:", error);
        return [];
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
    resolveAlert
  };
}
