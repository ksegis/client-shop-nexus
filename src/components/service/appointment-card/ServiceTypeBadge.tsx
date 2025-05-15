
import { Badge } from '@/components/ui/badge';

interface ServiceTypeBadgeProps {
  type: string;
}

export const ServiceTypeBadge = ({ type }: ServiceTypeBadgeProps) => {
  let color = '';
  
  switch (type) {
    case 'maintenance':
      color = 'bg-blue-100 text-blue-800';
      break;
    case 'repair':
      color = 'bg-amber-100 text-amber-800';
      break;
    case 'diagnostic':
      color = 'bg-purple-100 text-purple-800';
      break;
    case 'inspection':
      color = 'bg-green-100 text-green-800';
      break;
    case 'tire':
      color = 'bg-stone-100 text-stone-800';
      break;
    case 'oil':
      color = 'bg-cyan-100 text-cyan-800';
      break;
    default:
      color = 'bg-gray-100 text-gray-800';
  }
  
  const labels: Record<string, string> = {
    maintenance: 'Maintenance',
    repair: 'Repair',
    diagnostic: 'Diagnostic',
    inspection: 'Inspection',
    tire: 'Tire Service',
    oil: 'Oil Change',
    other: 'Other Service'
  };
  
  return <Badge className={color}>{labels[type] || 'Service'}</Badge>;
};
