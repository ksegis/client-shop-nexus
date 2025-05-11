
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const EmployeePerformance = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Employee performance metrics will appear here. This section will show data like completed jobs, customer satisfaction ratings, and efficiency metrics.
        </p>
      </CardContent>
    </Card>
  );
};
