
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { formatDistance } from 'date-fns';

interface UserAuditTrailProps {
  userId: string;
}

export const UserAuditTrail = ({ userId }: UserAuditTrailProps) => {
  const { auditLogs, isLoading } = useAuditLogs(userId);

  if (isLoading) {
    return <div className="text-center py-4">Loading audit trail...</div>;
  }

  const userLogs = auditLogs.filter(log => log.target_user_id === userId);

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create_user': return 'bg-green-100 text-green-800';
      case 'update_user': return 'bg-blue-100 text-blue-800';
      case 'delete_user': return 'bg-red-100 text-red-800';
      case 'toggle_status': return 'bg-yellow-100 text-yellow-800';
      case 'reset_password': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (userLogs.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No audit trail found for this user.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                  {log.action.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>{log.performed_by_email || 'System'}</TableCell>
              <TableCell>{log.description || '-'}</TableCell>
              <TableCell>
                {formatDistance(new Date(log.timestamp), new Date(), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
