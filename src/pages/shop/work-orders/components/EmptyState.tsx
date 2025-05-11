
import { Button } from '@/components/ui/button';
import { WorkOrderDialog } from '../WorkOrderDialog';
import { ClipboardList } from 'lucide-react';

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <ClipboardList className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No work orders found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Get started by creating a new work order
      </p>
      <WorkOrderDialog />
    </div>
  );
};
