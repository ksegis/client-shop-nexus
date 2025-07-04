
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
        .select('*')
        .order('timestamp', { ascending: false });

      if (userId) {
        query = query.eq('target_user_id', userId);
      }

      const { data: auditData, error } = await query;

      if (error) {
        console.error('Audit logs query error:', error);
        throw error;
      }

      // Fetch user emails for performed_by users (only for those that don't have target_user_email)
      const performedByUserIds = new Set<string>();
      auditData?.forEach(log => {
        if (log.performed_by) performedByUserIds.add(log.performed_by);
      });

      let userEmails: Record<string, string> = {};
      
      if (performedByUserIds.size > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', Array.from(performedByUserIds));

        if (!profilesError && profiles) {
          userEmails = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile.email;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const logsWithEmails = auditData?.map(log => ({
        ...log,
        // Use target_user_email if available, otherwise fall back to lookup
        target_user_email: log.target_user_email || (log.target_user_id ? (userEmails[log.target_user_id] || 'Unknown') : undefined),
        performed_by_email: log.performed_by ? (userEmails[log.performed_by] || 'System') : 'System'
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
