
import { formatCurrency } from '@/lib/utils';

interface LineItemTotalsProps {
  subtotal: number;
}

export const LineItemTotals = ({ subtotal }: LineItemTotalsProps) => {
  return (
    <div className="flex justify-end">
      <div className="w-64 bg-muted/20 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium text-lg">Subtotal:</span>
          <span className="font-bold text-lg">{formatCurrency(subtotal)}</span>
        </div>
      </div>
    </div>
  );
};
