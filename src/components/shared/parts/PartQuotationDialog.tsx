
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus } from "lucide-react";
import { QuotationItem } from "@/hooks/parts/usePartsQuotation";
import { toast } from "@/hooks/use-toast";

interface PartQuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: QuotationItem[];
  onRemoveItem: (partId: string) => void;
}

export function PartQuotationDialog({
  open,
  onOpenChange,
  items,
  onRemoveItem
}: PartQuotationDialogProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const coreCharges = items.reduce((total, item) => total + ((item.core_charge || 0) * item.quantity), 0);
  const grandTotal = subtotal + coreCharges;
  
  const handleSaveQuotation = () => {
    if (!customerName.trim()) {
      toast({
        title: "Customer name required",
        description: "Please enter a customer name for the quotation",
        variant: "destructive"
      });
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "No items in quotation",
        description: "Please add some parts to the quotation before saving",
        variant: "destructive"
      });
      return;
    }
    
    // Here you would typically save to database
    console.log('Saving quotation:', {
      customerName,
      customerEmail,
      items,
      notes,
      total: grandTotal
    });
    
    toast({
      title: "Quotation saved",
      description: `Quotation for ${customerName} has been saved successfully`,
    });
    
    // Reset form
    setCustomerName('');
    setCustomerEmail('');
    setNotes('');
    onOpenChange(false);
  };
  
  const handlePrintQuotation = () => {
    // Here you would implement print functionality
    toast({
      title: "Print quotation",
      description: "Print functionality would be implemented here",
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Parts Quotation</DialogTitle>
          <DialogDescription>
            Create a quotation for parts and services
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name *</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Customer Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter customer email"
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Quotation Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Quotation Items</h3>
              <Badge variant="secondary">{items.length} items</Badge>
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items in quotation yet.</p>
                <p className="text-sm">Add parts from the catalog to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.part_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.name || `Part ${item.part_id}`}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.sku || 'N/A'} • ${item.price.toFixed(2)} each
                        {item.core_charge && item.core_charge > 0 && (
                          <span> • Core: ${item.core_charge.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-sm">
                        Qty: {item.quantity}
                      </div>
                      <div className="text-sm font-medium">
                        ${(item.price * item.quantity + (item.core_charge || 0) * item.quantity).toFixed(2)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.part_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or special instructions..."
              className="w-full h-20 px-3 py-2 border border-input rounded-md resize-none"
            />
          </div>
          
          {/* Totals */}
          {items.length > 0 && (
            <div className="space-y-2 bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {coreCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Core Charges:</span>
                  <span>${coreCharges.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {items.length > 0 && (
            <Button variant="outline" onClick={handlePrintQuotation}>
              Print
            </Button>
          )}
          <Button onClick={handleSaveQuotation} disabled={items.length === 0}>
            Save Quotation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
