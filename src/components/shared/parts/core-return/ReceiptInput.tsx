
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ReceiptInputProps {
  receiptNumber: string;
  onReceiptChange: (value: string) => void;
}

export function ReceiptInput({ receiptNumber, onReceiptChange }: ReceiptInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="receipt">Receipt/Invoice Number *</Label>
      <Input 
        id="receipt" 
        value={receiptNumber} 
        onChange={(e) => onReceiptChange(e.target.value)}
        placeholder="Enter receipt or invoice number"
      />
    </div>
  );
}
