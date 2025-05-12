
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { SyncStatus } from '@/hooks/admin/useSyncHistory';

interface SyncHistoryCardProps {
  syncHistory: SyncStatus[];
}

const SyncHistoryCard: React.FC<SyncHistoryCardProps> = ({ syncHistory }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Synchronizations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {syncHistory.map((sync) => (
            <div key={sync.id} className="flex items-center justify-between p-2 border-b last:border-0">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {getStatusIcon(sync.status)}
                  <span className="font-medium">{sync.service}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(sync.timestamp)} • {sync.records} records
                </span>
              </div>
              <div>
                {getStatusBadge(sync.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncHistoryCard;
