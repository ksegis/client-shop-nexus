
import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { Alert } from '@/hooks/useSecurityDashboard';

interface ActiveAlertsTableProps {
  alerts: Alert[];
  loading: boolean;
  onResolve: (alertId: string) => Promise<boolean>;
}

export const ActiveAlertsTable: React.FC<ActiveAlertsTableProps> = ({ 
  alerts, 
  loading, 
  onResolve 
}) => {
  const [isResolvingAlert, setIsResolvingAlert] = useState<string | null>(null);
  
  const handleResolveAlert = async (alertId: string) => {
    setIsResolvingAlert(alertId);
    await onResolve(alertId);
    setIsResolvingAlert(null);
  };
  
  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'new_device':
        return 'New Device Detection';
      case 'impossible_travel':
        return 'Impossible Travel';
      case 'multiple_failures':
        return 'Multiple Authentication Failures';
      default:
        return 'Security Alert';
    }
  };

  if (loading) {
    return <div className="py-4">Loading active alerts...</div>;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">All Active Alerts</h3>
      {alerts && alerts.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>{alert.profiles?.email || 'Unknown'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    {getAlertTypeLabel(alert.alert_type)}
                  </div>
                </TableCell>
                <TableCell>{format(new Date(alert.created_at), 'PPp')}</TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={isResolvingAlert === alert.id}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isResolvingAlert === alert.id ? 'Resolving...' : 'Resolve'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 bg-muted/30 rounded-md">
          <p className="text-muted-foreground">No active security alerts</p>
        </div>
      )}
    </div>
  );
};
