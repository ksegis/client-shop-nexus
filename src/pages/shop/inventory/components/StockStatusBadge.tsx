
import { Badge } from '@/components/ui/badge';

interface StockStatusBadgeProps {
  status: 'out-of-stock' | 'low-stock' | 'in-stock';
}

export const StockStatusBadge = ({ status }: StockStatusBadgeProps) => {
  return (
    <Badge
      variant={
        status === 'out-of-stock' ? 'destructive' :
        status === 'low-stock' ? 'outline' : 'default'
      }
    >
      {status === 'out-of-stock' ? 'Out of Stock' :
       status === 'low-stock' ? 'Low Stock' : 'In Stock'}
    </Badge>
  );
};
