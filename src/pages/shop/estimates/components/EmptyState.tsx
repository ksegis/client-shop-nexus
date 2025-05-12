
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateEstimate: () => void;
}

export default function EmptyState({ onCreateEstimate }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed">
        <Plus className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No estimates found</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
        Create your first estimate to get started tracking work for your customers.
      </p>
      <Button onClick={onCreateEstimate} className="mt-6">
        Create Estimate
      </Button>
    </div>
  );
}
