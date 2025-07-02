
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceUpdatesList } from '@/components/shared/service/ServiceUpdatesList';
import { ServiceUpdate } from '@/hooks/work-orders/useServiceUpdates';

interface WorkOrderUpdatesTabProps {
  updates: ServiceUpdate[];
  loading: boolean;
}

export const WorkOrderUpdatesTab: React.FC<WorkOrderUpdatesTabProps> = ({ 
  updates,
  loading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Updates</CardTitle>
      </CardHeader>
      <CardContent>
        <ServiceUpdatesList
          updates={updates}
          loading={loading}
          isShopPortal={false}
        />
      </CardContent>
    </Card>
  );
};
