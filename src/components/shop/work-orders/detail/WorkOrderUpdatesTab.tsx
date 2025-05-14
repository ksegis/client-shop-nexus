
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ServiceUpdatesList } from '@/components/shared/service/ServiceUpdatesList';
import { ServiceUpdateForm } from '@/components/shop/service/ServiceUpdateForm';

interface WorkOrderUpdatesTabProps {
  updates: any[];
  updatesLoading: boolean;
  isSubmittingUpdate: boolean;
  onAddServiceUpdate: (updateData: {
    content: string;
    milestone?: string;
    milestone_completed?: boolean;
    images?: File[];
  }) => Promise<void>;
}

export const WorkOrderUpdatesTab: React.FC<WorkOrderUpdatesTabProps> = ({
  updates,
  updatesLoading,
  isSubmittingUpdate,
  onAddServiceUpdate
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Service Updates</CardTitle>
            <CardDescription>Progress updates shared with the customer</CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceUpdatesList
              updates={updates}
              loading={updatesLoading}
              isShopPortal={true}
            />
          </CardContent>
        </Card>
      </div>
      
      <div>
        <ServiceUpdateForm
          onSubmit={onAddServiceUpdate}
          isSubmitting={isSubmittingUpdate}
        />
      </div>
    </div>
  );
};
