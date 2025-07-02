
import { useCoreReturns } from '@/hooks/parts/useCoreReturns';
import { Part } from '@/types/parts';

export function useCoreReturnHandler() {
  const {
    selectedPart,
    isDialogOpen,
    setIsDialogOpen,
    openCoreReturnDialog,
    processCoreReturn
  } = useCoreReturns();
  
  const handleOpenCoreReturnDialog = (part: Part) => {
    console.log('Opening core return dialog for part:', part);
    openCoreReturnDialog(part);
  };
  
  // Process a core return
  const handleProcessCoreReturn = (refundAmount: number, condition: string) => {
    console.log('Processing core return:', { refundAmount, condition, selectedPart });
    if (selectedPart) {
      processCoreReturn(selectedPart.id, {
        reason: "Customer return",
        condition: condition as any,
        approved: true,
        refund_amount: refundAmount,
        processed_by: "Current User"
      });
    }
  };

  return {
    selectedPartForCoreReturn: selectedPart,
    isCoreReturnDialogOpen: isDialogOpen,
    setCoreReturnDialogOpen: setIsDialogOpen,
    handleOpenCoreReturnDialog,
    handleProcessCoreReturn
  };
}
