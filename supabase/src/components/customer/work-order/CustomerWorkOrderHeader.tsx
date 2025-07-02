
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WorkOrderHeaderProps {
  title: string;
  status: string;
}

export const CustomerWorkOrderHeader: React.FC<WorkOrderHeaderProps> = ({ 
  title, 
  status 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link to="/customer/work-orders">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Work Orders
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{title}</h1>
        <Badge className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
      </div>
    </div>
  );
};
