
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateNew: () => void;
}

export function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <Receipt className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mt-2">No invoices found</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
        Create your first invoice to start tracking payments and customer transactions.
      </p>
      <Button onClick={onCreateNew}>
        Create New Invoice
      </Button>
    </div>
  );
}

export default EmptyState;
