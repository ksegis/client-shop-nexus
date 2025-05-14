
import React from 'react';
import { useTesting } from '@/contexts/testing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bug, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { TestResult } from '@/types/testing';

interface TestResultDetailProps {
  testId: string;
  onBack: () => void;
  onEdit: (testResult: TestResult) => void;
  onDelete: (testId: string) => void;
  onAddBug: (testId: string) => void;
}

export const TestResultDetail: React.FC<TestResultDetailProps> = ({
  testId,
  onBack,
  onEdit,
  onDelete,
  onAddBug,
}) => {
  const { testResults } = useTesting();
  const testResult = testResults.find((t) => t.id === testId);

  if (!testResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Result Not Found</CardTitle>
          <CardDescription>
            The specified test result could not be found. It may have been deleted.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Test Results
          </Button>
        </CardFooter>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <Button variant="ghost" size="sm" className="mb-2" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <CardTitle>{testResult.test_name}</CardTitle>
          <CardDescription>
            Feature Area: {testResult.feature_area} | Environment: {testResult.environment}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Badge className={getStatusBadgeColor(testResult.status)}>
            {testResult.status.charAt(0).toUpperCase() + testResult.status.slice(1)}
          </Badge>
          <Badge className={getPriorityBadgeColor(testResult.priority)}>
            {testResult.priority.charAt(0).toUpperCase() + testResult.priority.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
          <p className="whitespace-pre-line">{testResult.description}</p>
        </div>

        {testResult.steps_to_reproduce && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Steps to Reproduce</h3>
            <p className="whitespace-pre-line">{testResult.steps_to_reproduce}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Tester</h3>
            <p>{testResult.tester_id}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
            <p>{format(new Date(testResult.created_at), 'PPpp')}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" onClick={() => onAddBug(testId)}>
            <Bug className="mr-2 h-4 w-4" /> Report Bug
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(testResult)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-red-600"
            onClick={() => onDelete(testId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
