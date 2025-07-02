
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { CardTitle, CardDescription, CardHeader as UICardHeader } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';

interface CardHeaderProps {
  vehicleInfo?: {
    year: string | number;
    make: string;
    model: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

export const CardHeader = ({ 
  vehicleInfo, 
  appointmentDate, 
  appointmentTime,
  status 
}: CardHeaderProps) => {
  const formattedDate = format(new Date(appointmentDate), 'PPP');

  return (
    <UICardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <CardTitle className="text-xl">
            {vehicleInfo 
              ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}` 
              : 'Vehicle Service'
            }
          </CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formattedDate}
              <span className="mx-1">•</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
              {appointmentTime}
            </div>
          </CardDescription>
        </div>
        
        <StatusBadge status={status} />
      </div>
    </UICardHeader>
  );
};
