
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  switch (status) {
    case 'scheduled':
      return <Badge className="bg-green-100 text-green-800">Scheduled</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-gray-500 border-gray-300">Cancelled</Badge>;
    case 'no_show':
      return <Badge className="bg-red-100 text-red-800">No Show</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
