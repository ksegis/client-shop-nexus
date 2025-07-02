
import { Badge } from '@/components/ui/badge';
import { EstimateStatus } from '../types';

interface StatusBadgeProps {
  status: EstimateStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'approved':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'declined':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return '';
    }
  };

  return (
    <Badge className={`${getVariant()} capitalize font-medium`}>
      {status}
    </Badge>
  );
}
