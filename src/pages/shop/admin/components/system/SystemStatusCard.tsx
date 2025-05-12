
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X } from 'lucide-react';
import { SystemStatus } from '@/hooks/admin/useSystemStatus';

interface SystemStatusCardProps {
  systems: SystemStatus[];
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ systems }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {systems.map((system, index) => (
            <div key={index} className="flex items-center justify-between p-2 border-b last:border-0">
              <div className="flex items-center gap-2">
                {getStatusIcon(system.status)}
                <span className="font-medium">{system.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(system.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatusCard;
