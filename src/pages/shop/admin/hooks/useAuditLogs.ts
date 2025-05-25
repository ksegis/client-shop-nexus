
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog } from '../types/adminTypes';
import { useToast } from '@/hooks/use-toast';

export const useAuditLogs = (userId?: string) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          target_profiles:profiles!target_user_id(email),
          performed_by_profiles:profiles!performed_by(email)
        `)
        .order('timestamp', { ascending: false });

      if (userId) {
        query = query.eq('target_user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Audit logs query error:', error);
        // Fallback to simple query without joins if the relation fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false });
          
        if (fallbackError) throw fallbackError;
        
        const logsWithEmails = fallbackData?.map(log => ({
          ...log,
          target_user_email: 'Unknown',
          performed_by_email: 'System'
        })) || [];
        
        setAuditLogs(logsWithEmails);
        return;
      }

      const logsWithEmails = data?.map(log => ({
        ...log,
        target_user_email: log.target_profiles?.email || 'Unknown',
        performed_by_email: log.performed_by_profiles?.email || 'System'
      })) || [];

      setAuditLogs(logsWithEmails);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();

    // Set up real-time subscription
    const channel = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs'
        },
        () => {
          fetchAuditLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    auditLogs,
    isLoading,
    refetch: fetchAuditLogs
  };
};
