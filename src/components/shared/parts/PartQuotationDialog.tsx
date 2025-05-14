
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PartQuotationForm } from './PartQuotationForm';
import { Part, PartOrderItem, PartQuotation } from '@/types/parts';
import { Button } from '@/components/ui/button';
import { Check, Download, Send } from 'lucide-react';

interface PartQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: (PartOrderItem & { part: Part })[];
  onRemoveItem: (partId: string) => void;
}

export function PartQuotationDialog({ 
  open, 
  onOpenChange,
  items,
  onRemoveItem
}: PartQuotationDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotation, setQuotation] = useState<PartQuotation | null>(null);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // In a real application, we would save this to the database
      // For now, we'll just simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date();
      const validUntil = new Date();
      validUntil.setDate(now.getDate() + data.validDays);
      
      // Calculate total
      const total = items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const coreCharge = (item.core_charge || 0) * item.quantity;
        return sum + itemTotal + coreCharge;
      }, 0);
      
      // Add tax
      const taxRate = 0.07; // 7% tax
      const totalWithTax = total + (total * taxRate);
      
      const newQuotation: PartQuotation = {
        id: `QT-${Math.floor(Math.random() * 10000)}`,
        customer_name: data.customerName,
        items: items.map(item => ({
          part_id: item.part_id,
          quantity: item.quantity,
          price: item.price,
          core_charge: item.core_charge
        })),
        status: 'draft',
        total: totalWithTax,
        valid_until: validUntil.toISOString(),
        notes: data.notes || '',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };
      
      setQuotation(newQuotation);
      
      toast({
        title: "Quotation created",
        description: `Quotation #${newQuotation.id} has been created successfully.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating quotation",
        description: "There was an error creating the quotation."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSendQuotation = () => {
    toast({
      title: "Quotation sent",
      description: `Quotation #${quotation?.id} has been sent to ${quotation?.customer_name}.`
    });
  };
  
  const handleDownloadQuotation = () => {
    toast({
      title: "Quotation downloaded",
      description: `Quotation #${quotation?.id} has been prepared for download.`
    });
  };
  
  const handleReset = () => {
    setQuotation(null);
  };
  
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setQuotation(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create Parts Quotation</DialogTitle>
          <DialogDescription>
            Generate a quotation for parts that can be sent to customers.
          </DialogDescription>
        </DialogHeader>

        {quotation ? (
          <div className="space-y-6 py-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-center gap-2">
              <Check className="h-5 w-5" />
              <div>
                <h3 className="font-medium text-lg">Quotation Created!</h3>
                <p>Quotation #{quotation.id} is ready to send or download.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Customer</h3>
              <p>{quotation.customer_name}</p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Quotation Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Quotation #:</span> {quotation.id}
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span> {new Date(quotation.created_at).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Valid Until:</span> {new Date(quotation.valid_until).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span> ${quotation.total.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Create New
                </Button>
                <Button variant="outline" onClick={handleDownloadQuotation} className="flex items-center gap-1">
                  <Download className="h-4 w-4" /> Download
                </Button>
                <Button onClick={handleSendQuotation} className="flex items-center gap-1">
                  <Send className="h-4 w-4" /> Send to Customer
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <PartQuotationForm
            items={items}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            onRemoveItem={onRemoveItem}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
