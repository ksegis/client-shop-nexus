
import React from 'react';
import { useTesting } from '@/contexts/testing';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface BugsListProps {
  onSelectBug?: (bugId: string) => void;
}

export const BugsList: React.FC<BugsListProps> = ({ onSelectBug }) => {
  const { bugs, isLoadingBugs } = useTesting();

  // Function to get badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'wont_fix':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get severity badge color
  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'trivial':
        return 'bg-gray-100 text-gray-800';
      case 'minor':
        return 'bg-blue-100 text-blue-800';
      case 'major':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'blocker':
        return 'bg-red-900 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoadingBugs) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (bugs.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">No bugs found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bug Title</TableHead>
            <TableHead>Feature Area</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Reported By</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bugs.map((bug) => (
            <TableRow 
              key={bug.id} 
              className="cursor-pointer hover:bg-muted/60"
              onClick={() => onSelectBug && onSelectBug(bug.id)}
            >
              <TableCell className="font-medium">{bug.title}</TableCell>
              <TableCell>{bug.feature_area}</TableCell>
              <TableCell>
                <Badge className={getStatusBadgeColor(bug.status)}>
                  {bug.status.replace('_', ' ').charAt(0).toUpperCase() + bug.status.replace('_', ' ').slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getSeverityBadgeColor(bug.severity)}>
                  {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{bug.reported_by}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(bug.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
