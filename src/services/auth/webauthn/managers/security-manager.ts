
import { supabase } from '@/integrations/supabase/client';

class SecurityManager {
  /**
   * Log a security alert for a user
   * @param userId User ID
   * @param alertType Type of alert
   * @param metadata Additional metadata
   * @returns 
   */
  async logSecurityAlert(userId: string, alertType: string, metadata: Record<string, any> = {}) {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          user_id: userId,
          alert_type: alertType,
          metadata
        });
        
      return !error;
    } catch (error) {
      console.error('Error logging security alert:', error);
      return false;
    }
  }
}

export const securityManager = new SecurityManager();
