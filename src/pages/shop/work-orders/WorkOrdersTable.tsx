
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { WorkOrderDialog } from './WorkOrderDialog';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { useWorkOrders } from './WorkOrdersContext';
import { WorkOrder, WorkOrderStatus } from './types';
import { StatusBadge } from './components/StatusBadge';
import { EmptyState } from './components/EmptyState';

interface WorkOrdersTableProps {
  status: string;
}

export const WorkOrdersTable = ({ status }: WorkOrdersTableProps) => {
  const { workOrders, isLoading, error } = useWorkOrders();
  const [sortField, setSortField] = useState<keyof WorkOrder>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    console.log("Current work orders:", workOrders);
  }, [workOrders]);
  
  // Filter work orders based on the selected tab
  const filteredWorkOrders = workOrders.filter(order => {
    if (status === 'active') {
      return order.status === 'pending' || order.status === 'in_progress';
    } else if (status === 'completed') {
      return order.status === 'completed';
    }
    return true; // 'all' tab
  });
  
  // Sort work orders
  const sortedWorkOrders = [...filteredWorkOrders].sort((a, b) => {
    if (a[sortField] === null) return 1;
    if (b[sortField] === null) return -1;
    
    if (a[sortField] < b[sortField]) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (a[sortField] > b[sortField]) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  const handleSort = (field: keyof WorkOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const renderSortIcon = (field: keyof WorkOrder) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading work orders...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading work orders: {error.message}</div>;
  }

  if (workOrders.length === 0) {
    return <EmptyState />;
  }

  if (filteredWorkOrders.length === 0) {
    if (status === 'active') {
      return <div className="p-8 text-center">No active work orders found.</div>;
    } else if (status === 'completed') {
      return <div className="p-8 text-center">No completed work orders found.</div>;
    }
    return <EmptyState />;
  }

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <Table className="table-auto">
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[100px] cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-2">
                  ID {renderSortIcon('id')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Title {renderSortIcon('title')}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Customer</TableHead>
              <TableHead className="hidden md:table-cell">Vehicle</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status {renderSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="hidden md:table-cell cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  Date {renderSortIcon('created_at')}
                </div>
              </TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWorkOrders.map((workOrder) => (
              <TableRow key={workOrder.id}>
                <TableCell className="font-medium">
                  #{workOrder.id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{workOrder.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {workOrder.description || 'No description'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {workOrder.customer ? (
                    <p>{workOrder.customer.first_name} {workOrder.customer.last_name}</p>
                  ) : 'N/A'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {workOrder.vehicle ? (
                    <p>{workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}</p>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={workOrder.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(workOrder.created_at).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <WorkOrderDialog workOrder={workOrder} />
                    <DeleteConfirmationDialog workOrderId={workOrder.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
