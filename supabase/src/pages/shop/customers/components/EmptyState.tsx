
import { Button } from '@/components/ui/button';
import { User, Search } from 'lucide-react';
import { CustomerDialog } from '../CustomerDialog';

interface EmptyStateProps {
  filter: 'all' | 'recent';
  searchQuery?: string;
}

export default function EmptyState({ filter, searchQuery }: EmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No customers found</h3>
        <p className="text-muted-foreground mb-4">
          No customers match your search "{searchQuery}"
        </p>
      </div>
    );
  }
  
  if (filter === 'recent') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No recent customers</h3>
        <p className="text-muted-foreground mb-4">
          You haven't added any customers in the last 30 days
        </p>
        <CustomerDialog />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <User className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No customers</h3>
      <p className="text-muted-foreground mb-4">
        Start by adding your first customer
      </p>
      <CustomerDialog />
    </div>
  );
}
