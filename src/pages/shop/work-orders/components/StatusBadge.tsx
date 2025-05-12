
import { Badge } from '@/components/ui/badge';
import { WorkOrderStatus } from '../types';

interface StatusBadgeProps {
  status: WorkOrderStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  let variant: 'default' | 'outline' | 'secondary' | 'destructive' = 'default';
  
  switch (status) {
    case 'pending':
      variant = 'secondary';
      break;
    case 'in_progress':
      variant = 'default';
      break;
    case 'completed':
      variant = 'outline';
      break;
    case 'cancelled':
      variant = 'destructive';
      break;
    default:
      variant = 'default';
  }
  
  return (
    <Badge variant={variant}>
      {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
