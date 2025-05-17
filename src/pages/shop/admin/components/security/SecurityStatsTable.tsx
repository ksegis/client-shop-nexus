
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SecurityStat } from '@/hooks/useSecurityDashboard';

interface SecurityStatsTableProps {
  stats: SecurityStat[];
  loading: boolean;
}

export const SecurityStatsTable: React.FC<SecurityStatsTableProps> = ({ stats, loading }) => {
  if (loading) {
    return <div className="py-4">Loading security statistics...</div>;
  }
  
  if (!stats || stats.length === 0) {
    return <div className="text-center py-4">No security statistics available</div>;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Security Overview by User</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Devices</TableHead>
            <TableHead>Active Alerts</TableHead>
            <TableHead>Risk Level</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((stat) => (
            <TableRow key={stat.user_id}>
              <TableCell>{stat.email}</TableCell>
              <TableCell>{stat.devices}</TableCell>
              <TableCell>
                {stat.active_alerts > 0 ? (
                  <Badge variant="destructive">{stat.active_alerts}</Badge>
                ) : (
                  <Badge variant="outline">0</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    stat.active_alerts > 1 ? "destructive" : 
                    stat.active_alerts > 0 ? "default" : "outline"
                  }
                >
                  {stat.active_alerts > 1 ? "High" : 
                   stat.active_alerts > 0 ? "Medium" : "Low"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
