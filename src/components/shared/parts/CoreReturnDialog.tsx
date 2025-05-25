
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Part } from "@/types/parts";
import { usePartsCatalog } from "@/hooks/parts/usePartsCatalog";
import { PartSelector } from "./core-return/PartSelector";
import { PartDetails } from "./core-return/PartDetails";
import { ReceiptInput } from "./core-return/ReceiptInput";
import { ReturnCondition } from "./core-return/ReturnCondition";
import { TermsCheckbox } from "./core-return/TermsCheckbox";
import { RefundSummary } from "./core-return/RefundSummary";

interface CoreReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessReturn?: (refundAmount: number, condition: string) => void;
}

export function CoreReturnDialog({ open, onOpenChange, onProcessReturn }: CoreReturnDialogProps) {
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [condition, setCondition] = useState<'new' | 'used' | 'damaged'>('new');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const { parts } = usePartsCatalog();
  
  // Filter parts that have core charges
  const partsWithCoreCharges = parts.filter(part => part.core_charge && part.core_charge > 0);
  
  // Get selected part
  const selectedPart = partsWithCoreCharges.find(part => part.id === selectedPartId);
  
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedPartId('');
      setCondition('new');
      setReceiptNumber('');
      setAcceptTerms(false);
    }
  }, [open]);
  
  // Calculate refund amount based on condition
  const calculateRefundAmount = () => {
    if (!selectedPart?.core_charge) return 0;
    
    switch(condition) {
      case 'new':
        return selectedPart.core_charge;
      case 'used':
        return selectedPart.core_charge * 0.75;
      case 'damaged':
        return selectedPart.core_charge * 0.25;
      default:
        return 0;
    }
  };
  
  const refundAmount = calculateRefundAmount();
  
  const handleProcessReturn = () => {
    if (!selectedPartId) {
      toast({
        title: "Part not selected",
        description: "Please select a part to process the core return",
        variant: "destructive"
      });
      return;
    }
    
    if (!receiptNumber || !acceptTerms) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and accept the terms",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedPart?.core_charge) {
      toast({
        title: "No core charge",
        description: "Selected part does not have a core charge",
        variant: "destructive"
      });
      return;
    }
    
    // Process the return
    if (onProcessReturn) {
      onProcessReturn(refundAmount, condition);
    }
    
    toast({
      title: "Core return processed",
      description: `Processed return for ${selectedPart.name} with refund amount $${refundAmount.toFixed(2)}.`
    });
    
    // Reset form and close dialog
    handleClose();
  };
  
  const handleClose = () => {
    setSelectedPartId('');
    setCondition('new');
    setReceiptNumber('');
    setAcceptTerms(false);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Core Return</DialogTitle>
          <DialogDescription>
            Select a part and process a core return for refund. Refund amount depends on the condition of the returned part.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <PartSelector 
            partsWithCoreCharges={partsWithCoreCharges}
            selectedPartId={selectedPartId}
            onPartSelect={setSelectedPartId}
          />
          
          {selectedPart && (
            <>
              <PartDetails selectedPart={selectedPart} />
              
              <ReceiptInput 
                receiptNumber={receiptNumber}
                onReceiptChange={setReceiptNumber}
              />
              
              <ReturnCondition 
                condition={condition}
                onConditionChange={setCondition}
              />
              
              <TermsCheckbox 
                acceptTerms={acceptTerms}
                onTermsChange={setAcceptTerms}
              />
              
              <RefundSummary 
                selectedPart={selectedPart}
                condition={condition}
                refundAmount={refundAmount}
              />
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcessReturn}
            disabled={!selectedPartId || !receiptNumber || !acceptTerms}
          >
            Process Return
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
