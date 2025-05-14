
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CarFront, Wrench, DollarSign, Clock, FileText } from 'lucide-react';
import { ServiceHistoryEntry } from '@/hooks/useServiceHistory';

interface ServiceHistoryCardProps {
  entry: ServiceHistoryEntry & {
    vehicles?: { make: string; model: string; year: number | string };
    profiles?: { first_name: string | null; last_name: string | null };
  };
}

const ServiceHistoryCard = ({ entry }: ServiceHistoryCardProps) => {
  const { 
    service_date, 
    service_type, 
    description, 
    technician_notes, 
    parts_used, 
    labor_hours, 
    total_cost,
    vehicles,
    profiles
  } = entry;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg">
            {vehicles ? `${vehicles.year} ${vehicles.make} ${vehicles.model}` : 'Vehicle Service'}
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-800">{service_type}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(service_date), 'PPP')}
          {profiles && (
            <span> • Technician: {profiles.first_name} {profiles.last_name}</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-2">
        {description && (
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-sm font-medium">
              <FileText className="h-3.5 w-3.5" />
              Service Details:
            </div>
            <p className="text-sm">{description}</p>
          </div>
        )}
        
        {technician_notes && (
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-sm font-medium">
              <Wrench className="h-3.5 w-3.5" />
              Technician Notes:
            </div>
            <p className="text-sm">{technician_notes}</p>
          </div>
        )}
        
        {parts_used && parts_used.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-sm font-medium">
              <CarFront className="h-3.5 w-3.5" />
              Parts Used:
            </div>
            <div className="grid grid-cols-2 gap-1">
              {parts_used.map((part, index) => (
                <span key={index} className="text-sm">{part}</span>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-2 flex flex-wrap gap-4">
          <div className="flex items-center text-sm">
            <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <span className="font-medium mr-1">Labor:</span>
            {labor_hours} {labor_hours === 1 ? 'hour' : 'hours'}
          </div>
          <div className="flex items-center text-sm">
            <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <span className="font-medium mr-1">Total:</span>
            ${total_cost.toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceHistoryCard;
