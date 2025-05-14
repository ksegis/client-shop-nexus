
import { ServiceHistoryEntry } from '@/hooks/useServiceHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, Clock, DollarSign, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ServiceHistoryCardProps {
  entry: ServiceHistoryEntry;
}

const ServiceHistoryCard = ({ entry }: ServiceHistoryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Format service date
  const formattedDate = entry.service_date 
    ? format(new Date(entry.service_date), 'PP') 
    : 'Not specified';
    
  // Format description to truncate if too long
  const truncatedDescription = entry.description && entry.description.length > 100 
    ? `${entry.description.substring(0, 100)}...` 
    : entry.description;
    
  // Service type badge color
  const getBadgeVariant = (type: string) => {
    switch(type.toLowerCase()) {
      case 'oil change':
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'repair':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'diagnosis':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'inspection':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <FileText className="mr-2 h-5 w-5" /> 
            {entry.service_type}
          </CardTitle>
          <Badge className={getBadgeVariant(entry.service_type)}>
            {formattedDate}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {expanded ? entry.description : truncatedDescription}
          </p>
          
          {entry.description && entry.description.length > 100 && (
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs text-blue-600"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Read less' : 'Read more'}
            </Button>
          )}
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-400 mr-1" />
              <span>{entry.labor_hours} hrs</span>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
              <span>${entry.total_cost.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center">
              <Wrench className="h-4 w-4 text-gray-400 mr-1" />
              <span>{(entry.parts_used?.length || 0)} parts</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceHistoryCard;
