
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const StorageUsageCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Database Storage</span>
              <span className="text-sm text-muted-foreground">42% (420MB/1GB)</span>
            </div>
            <Progress value={42} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">File Storage</span>
              <span className="text-sm text-muted-foreground">17% (1.7GB/10GB)</span>
            </div>
            <Progress value={17} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">API Requests (Monthly)</span>
              <span className="text-sm text-muted-foreground">73% (73K/100K)</span>
            </div>
            <Progress value={73} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageUsageCard;
