
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Repeat } from 'lucide-react';
import { CoreReturnDialog } from '@/components/shared/parts/CoreReturnDialog';
import { InventoryItem } from '../types';

interface CoreReturnButtonProps {
  item: InventoryItem;
}

export const CoreReturnButton = ({ item }: CoreReturnButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Only show button for items with core charges
  if (!item.core_charge || item.core_charge <= 0) {
    return null;
  }

  const handleProcessReturn = (refundAmount: number, condition: string) => {
    console.log('Processing core return for inventory item:', {
      item: item.name,
      refundAmount,
      condition
    });
    // In a real app, you would process the return here
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="text-xs"
      >
        <Repeat className="h-3 w-3 mr-1" />
        Core Return
      </Button>
      
      <CoreReturnDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onProcessReturn={handleProcessReturn}
      />
    </>
  );
};
