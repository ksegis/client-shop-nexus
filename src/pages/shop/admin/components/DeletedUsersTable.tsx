
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { formatDistance } from 'date-fns';

interface DeletedUsersTableProps {
  searchTerm: string;
}

export const DeletedUsersTable = ({ searchTerm }: DeletedUsersTableProps) => {
  const { auditLogs, isLoading } = useAuditLogs();

  // Filter audit logs for delete_user actions
  const deletedUserLogs = auditLogs
    .filter(log => log.action === 'delete_user')
    .filter(log => {
      if (!searchTerm) return true;
      const email = log.target_user_email || '';
      return email.toLowerCase().includes(searchTerm.toLowerCase());
    });

  if (isLoading) {
    return <div className="text-center py-8">Loading deleted users...</div>;
  }

  if (deletedUserLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No deleted users found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Deleted By</TableHead>
            <TableHead>Deleted At</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletedUserLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                {log.target_user_email || 'Unknown'}
              </TableCell>
              <TableCell>
                {log.performed_by_email || 'System'}
              </TableCell>
              <TableCell>
                {formatDistance(new Date(log.timestamp), new Date(), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <Badge variant="destructive">
                  Deleted
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
