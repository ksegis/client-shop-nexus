
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Part } from "@/types/parts";

interface CoreChargeHandlerProps {
  part: Part | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessReturn?: (refundAmount: number, condition: string) => void;
}

export function CoreChargeHandler({ part, open, onOpenChange, onProcessReturn }: CoreChargeHandlerProps) {
  const [condition, setCondition] = useState<'new' | 'used' | 'damaged'>('new');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Reset form when dialog opens/closes
  useState(() => {
    if (open) {
      setCondition('new');
      setReceiptNumber('');
      setAcceptTerms(false);
    }
  });
  
  // Calculate refund amount based on condition
  const calculateRefundAmount = () => {
    if (!part?.core_charge) return 0;
    
    switch(condition) {
      case 'new':
        return part.core_charge;
      case 'used':
        return part.core_charge * 0.75;
      case 'damaged':
        return part.core_charge * 0.25;
      default:
        return 0;
    }
  };
  
  const refundAmount = calculateRefundAmount();
  
  const handleProcessReturn = () => {
    if (!receiptNumber || !acceptTerms) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and accept the terms",
        variant: "destructive"
      });
      return;
    }
    
    if (!part?.core_charge) {
      toast({
        title: "No core charge",
        description: "This part does not have a core charge",
        variant: "destructive"
      });
      return;
    }
    
    // Process the return
    if (onProcessReturn) {
      onProcessReturn(refundAmount, condition);
    }
    
    // Reset form and close dialog
    setCondition('new');
    setReceiptNumber('');
    setAcceptTerms(false);
    onOpenChange(false);
  };
  
  const handleClose = () => {
    setCondition('new');
    setReceiptNumber('');
    setAcceptTerms(false);
    onOpenChange(false);
  };
  
  if (!part) return null;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Process Core Return</DialogTitle>
          <DialogDescription>
            Return a core for refund. Refund amount depends on the condition of the returned part.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{part.name}</h3>
            <p className="text-sm text-muted-foreground">
              SKU: {part.sku}
            </p>
            <p className="text-sm text-muted-foreground">
              Original core charge: ${part.core_charge?.toFixed(2) || '0.00'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt/Invoice Number *</Label>
            <Input 
              id="receipt" 
              value={receiptNumber} 
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Enter receipt or invoice number"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Part Condition *</Label>
            <RadioGroup 
              value={condition} 
              onValueChange={(value) => setCondition(value as 'new' | 'used' | 'damaged')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="condition-new" />
                <Label htmlFor="condition-new">New/Like New (100% refund)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="used" id="condition-used" />
                <Label htmlFor="condition-used">Used/Working (75% refund)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="damaged" id="condition-damaged" />
                <Label htmlFor="condition-damaged">Damaged/Partial (25% refund)</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="terms" 
              checked={acceptTerms} 
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm leading-tight">
              I confirm that this core part is being returned in the condition stated above and 
              was originally purchased from this shop. *
            </Label>
          </div>
          
          <div className="rounded-md bg-muted p-4">
            <div className="text-sm font-medium mb-2">Refund Summary</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Original core charge:</span>
                <span>${part.core_charge?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Condition adjustment:</span>
                <span>{condition === 'new' ? '100%' : condition === 'used' ? '75%' : '25%'}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Refund amount:</span>
                <span className="text-green-600">${refundAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcessReturn}
            disabled={!receiptNumber || !acceptTerms}
          >
            Process Return
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
