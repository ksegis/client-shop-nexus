
import { Part } from "@/types/parts";

interface RefundSummaryProps {
  selectedPart: Part;
  condition: 'new' | 'used' | 'damaged';
  refundAmount: number;
}

export function RefundSummary({ selectedPart, condition, refundAmount }: RefundSummaryProps) {
  return (
    <div className="rounded-md bg-muted p-4">
      <div className="text-sm font-medium mb-2">Refund Summary</div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Original core charge:</span>
          <span>${selectedPart.core_charge?.toFixed(2) || '0.00'}</span>
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
  );
}
