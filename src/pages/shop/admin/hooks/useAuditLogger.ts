
import { supabase } from '@/integrations/supabase/client';

export const useAuditLogger = () => {
  const logAuditEvent = async (action: string, targetUserId: string, description?: string, metadata?: any) => {
    try {
      await supabase.rpc('log_audit_event', {
        p_action: action,
        p_target_user_id: targetUserId,
        p_description: description,
        p_metadata: metadata || {}
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

  return { logAuditEvent };
};
