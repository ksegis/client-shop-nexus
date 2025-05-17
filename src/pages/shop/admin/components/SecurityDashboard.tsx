
import React from 'react';
import { useSecurityDashboard } from '@/hooks/useSecurityDashboard';
import { SecurityAlerts } from './SecurityAlerts';
import { SecurityStatsTable } from './security/SecurityStatsTable';
import { ActiveAlertsTable } from './security/ActiveAlertsTable';

export default function SecurityDashboard() {
  const { 
    alerts, 
    alertsLoading, 
    securityStats, 
    statsLoading, 
    resolveAlert 
  } = useSecurityDashboard();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
      </div>

      {/* Forward active alerts to the SecurityAlerts component */}
      <SecurityAlerts 
        alerts={(alerts || []).map(alert => ({
          id: alert.id,
          alert_type: alert.alert_type as any,
          metadata: alert.metadata,
          created_at: alert.created_at,
          user_id: alert.user_id
        }))} 
        loading={alertsLoading}
        onResolve={resolveAlert}
      />

      {/* Stats Table - only render if we have stats */}
      <SecurityStatsTable stats={securityStats || []} loading={statsLoading} />

      {/* All Alerts Table */}
      <ActiveAlertsTable alerts={alerts || []} loading={alertsLoading} onResolve={resolveAlert} />
    </div>
  );
}
