
import React, { createContext, useContext, ReactNode } from 'react';
import { WorkOrder, WorkOrderLineItem } from './types';
import { useWorkOrdersQuery } from './hooks/useWorkOrdersQuery';
import { useWorkOrderCrud } from './hooks/useWorkOrderCrud';
import { useWorkOrderLineItems } from './hooks/useWorkOrderLineItems';

interface WorkOrdersContextType {
  workOrders: WorkOrder[];
  isLoading: boolean;
  error: Error | null;
  createWorkOrder: (workOrder: Partial<WorkOrder>, lineItems?: WorkOrderLineItem[]) => Promise<void>;
  updateWorkOrder: (id: string, workOrder: Partial<WorkOrder>, lineItems?: WorkOrderLineItem[]) => Promise<void>;
  deleteWorkOrder: (id: string) => Promise<void>;
  refreshWorkOrders: () => Promise<void>;
  getWorkOrderLineItems: (workOrderId: string) => Promise<WorkOrderLineItem[]>;
  addLineItem: (workOrderId: string, lineItem: Partial<WorkOrderLineItem>) => Promise<void>;
  updateLineItem: (lineItemId: string, lineItem: Partial<WorkOrderLineItem>) => Promise<void>;
  deleteLineItem: (lineItemId: string) => Promise<void>;
}

const WorkOrdersContext = createContext<WorkOrdersContextType | undefined>(undefined);

export function WorkOrdersProvider({ children }: { children: ReactNode }) {
  const { workOrders, isLoading, error, refreshWorkOrders } = useWorkOrdersQuery();
  const { createWorkOrder, updateWorkOrder, deleteWorkOrder } = useWorkOrderCrud(refreshWorkOrders);
  const { getWorkOrderLineItems, addLineItem: addItem, updateLineItem: updateItem, deleteLineItem: deleteItem } = useWorkOrderLineItems();

  // Wrap the functions to match the expected void return type
  const addLineItem = async (workOrderId: string, lineItem: Partial<WorkOrderLineItem>): Promise<void> => {
    await addItem(workOrderId, lineItem);
  };

  const updateLineItem = async (lineItemId: string, lineItem: Partial<WorkOrderLineItem>): Promise<void> => {
    await updateItem(lineItemId, lineItem);
  };

  const deleteLineItem = async (lineItemId: string): Promise<void> => {
    await deleteItem(lineItemId);
  };

  return (
    <WorkOrdersContext.Provider
      value={{
        workOrders,
        isLoading,
        error,
        createWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        refreshWorkOrders,
        getWorkOrderLineItems,
        addLineItem,
        updateLineItem,
        deleteLineItem
      }}
    >
      {children}
    </WorkOrdersContext.Provider>
  );
}

export function useWorkOrders() {
  const context = useContext(WorkOrdersContext);
  if (context === undefined) {
    throw new Error('useWorkOrders must be used within a WorkOrdersProvider');
  }
  return context;
}

export { WorkOrdersContext };
