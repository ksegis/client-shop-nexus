
import React from 'react';
import { WorkOrderDetailsTab } from './WorkOrderDetailsTab';
import { WorkOrderUpdatesTab } from './WorkOrderUpdatesTab';
import { WorkOrderCustomerTab } from './WorkOrderCustomerTab';
import { WorkOrderVehicleTab } from './WorkOrderVehicleTab';

interface WorkOrderTabContentProps {
  activeTab: string;
  workOrder: any;
  lineItems: any[];
  updates: any[];
  updatesLoading: boolean;
  isSubmittingUpdate: boolean;
  handleAddServiceUpdate: (updateData: {
    content: string;
    milestone?: string;
    milestone_completed?: boolean;
    images?: File[];
  }) => Promise<void>;
  getStatusColor: (status: string) => string;
}

export const WorkOrderTabContent: React.FC<WorkOrderTabContentProps> = ({
  activeTab,
  workOrder,
  lineItems,
  updates,
  updatesLoading,
  isSubmittingUpdate,
  handleAddServiceUpdate,
  getStatusColor
}) => {
  if (activeTab === 'details') {
    return (
      <WorkOrderDetailsTab 
        workOrder={workOrder} 
        lineItems={lineItems}
        getStatusColor={getStatusColor}
      />
    );
  }
  
  if (activeTab === 'updates') {
    return (
      <WorkOrderUpdatesTab
        updates={updates}
        updatesLoading={updatesLoading}
        isSubmittingUpdate={isSubmittingUpdate}
        onAddServiceUpdate={handleAddServiceUpdate}
      />
    );
  }
  
  if (activeTab === 'customer') {
    return <WorkOrderCustomerTab workOrder={workOrder} />;
  }
  
  if (activeTab === 'vehicle') {
    return <WorkOrderVehicleTab workOrder={workOrder} />;
  }
  
  return null;
};
