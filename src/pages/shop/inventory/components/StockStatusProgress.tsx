
import { Progress } from '@/components/ui/progress';

interface StockStatusProgressProps {
  quantity: number;
  reorderLevel: number;
  status: 'out-of-stock' | 'low-stock' | 'in-stock';
}

export const StockStatusProgress = ({ quantity, reorderLevel, status }: StockStatusProgressProps) => {
  return (
    <Progress
      value={Math.min((quantity / (reorderLevel * 2)) * 100, 100)}
      className={
        status === 'out-of-stock' ? 'bg-red-200' :
        status === 'low-stock' ? 'bg-amber-200' : ''
      }
    />
  );
};
