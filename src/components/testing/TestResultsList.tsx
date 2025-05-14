
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

interface TestResultsListProps {
  onSelectTestResult?: (testId: string) => void;
}

export const TestResultsList: React.FC<TestResultsListProps> = ({ onSelectTestResult }) => {
  const { testResults, isLoadingTestResults } = useTesting();

  // Function to get badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get priority badge color
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoadingTestResults) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (testResults.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">No test results found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Test Name</TableHead>
            <TableHead>Feature Area</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Tester</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testResults.map((test) => (
            <TableRow 
              key={test.id} 
              className="cursor-pointer hover:bg-muted/60"
              onClick={() => onSelectTestResult && onSelectTestResult(test.id)}
            >
              <TableCell className="font-medium">{test.test_name}</TableCell>
              <TableCell>{test.feature_area}</TableCell>
              <TableCell>
                <Badge className={getStatusBadgeColor(test.status)}>
                  {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityBadgeColor(test.priority)}>
                  {test.priority.charAt(0).toUpperCase() + test.priority.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{test.tester_id}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
