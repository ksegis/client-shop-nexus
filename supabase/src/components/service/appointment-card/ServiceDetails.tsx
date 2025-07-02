
import { Car, FileText } from 'lucide-react';
import { ServiceTypeBadge } from './ServiceTypeBadge';

interface ServiceDetailsProps {
  serviceType: string;
  description?: string | null;
}

export const ServiceDetails = ({ serviceType, description }: ServiceDetailsProps) => {
  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Service Type:</span>
        </div>
        <ServiceTypeBadge type={serviceType} />
      </div>
      
      {description && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Description:</span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
    </>
  );
};
