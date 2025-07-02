
import React from 'react';
import { useTesting } from '@/contexts/testing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Bug } from '@/types/testing';

interface BugDetailProps {
  bugId: string;
  onBack: () => void;
  onEdit: (bug: Bug) => void;
  onDelete: (bugId: string) => void;
}

export const BugDetail: React.FC<BugDetailProps> = ({
  bugId,
  onBack,
  onEdit,
  onDelete,
}) => {
  const { bugs } = useTesting();
  const bug = bugs.find((b) => b.id === bugId);

  if (!bug) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bug Not Found</CardTitle>
          <CardDescription>
            The specified bug could not be found. It may have been deleted.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bugs
          </Button>
        </CardFooter>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <CardTitle>{bug.title}</CardTitle>
          <CardDescription>
            Feature Area: {bug.feature_area}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Badge className={getStatusBadgeColor(bug.status)}>
            {bug.status.replace('_', ' ').charAt(0).toUpperCase() + bug.status.replace('_', ' ').slice(1)}
          </Badge>
          <Badge className={getSeverityBadgeColor(bug.severity)}>
            {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
          <p className="whitespace-pre-line">{bug.description}</p>
        </div>

        {bug.steps_to_reproduce && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Steps to Reproduce</h3>
            <p className="whitespace-pre-line">{bug.steps_to_reproduce}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bug.expected_result && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Expected Result</h3>
              <p>{bug.expected_result}</p>
            </div>
          )}
          
          {bug.actual_result && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Actual Result</h3>
              <p>{bug.actual_result}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Reported By</h3>
            <p>{bug.reported_by}</p>
          </div>

          {bug.assigned_to && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
              <p>{bug.assigned_to}</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
            <p>{format(new Date(bug.created_at), 'PPpp')}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
            <p>{format(new Date(bug.updated_at), 'PPpp')}</p>
          </div>
        </div>
        
        {bug.test_result_id && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Test Result ID</h3>
            <p>{bug.test_result_id}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(bug)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-red-600"
            onClick={() => onDelete(bugId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
