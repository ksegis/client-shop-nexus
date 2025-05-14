
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ServiceHistoryEntry } from '@/hooks/useServiceHistory';
import { Calendar, Clock, User, Car, FileText, Settings, CheckCircle } from 'lucide-react';

interface ServiceDetailsViewProps {
  entry: ServiceHistoryEntry;
}

export const ServiceDetailsView = ({ entry }: ServiceDetailsViewProps) => {
  const [showTechNotes, setShowTechNotes] = useState(false);
  
  // Format service date
  const formattedDate = entry.service_date 
    ? format(new Date(entry.service_date), 'PPP') 
    : 'Not specified';
    
  // Service status badge color
  const getStatusColor = (type: string) => {
    switch(type.toLowerCase()) {
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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{entry.service_type}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" /> {formattedDate}
            </CardDescription>
          </div>
          
          <Badge className={getStatusColor(entry.service_type)}>
            {entry.service_type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium flex items-center gap-1 mb-1">
              <Settings className="h-4 w-4" /> Service Description
            </h4>
            <p className="text-sm text-gray-600">{entry.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium flex items-center gap-1 mb-1">
                <Clock className="h-4 w-4" /> Labor Hours
              </h4>
              <p className="text-sm text-gray-600">{entry.labor_hours} hours</p>
            </div>
            
            <div>
              <h4 className="font-medium flex items-center gap-1 mb-1">
                <FileText className="h-4 w-4" /> Total Cost
              </h4>
              <p className="text-sm text-gray-600">${entry.total_cost.toFixed(2)}</p>
            </div>
          </div>
          
          {entry.parts_used && entry.parts_used.length > 0 && (
            <div>
              <h4 className="font-medium flex items-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4" /> Parts Used
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-600 pl-1">
                {entry.parts_used.map((part, index) => (
                  <li key={index}>{part}</li>
                ))}
              </ul>
            </div>
          )}
          
          {entry.technician_notes && (
            <div>
              <button 
                onClick={() => setShowTechNotes(!showTechNotes)}
                className="text-sm font-medium flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                {showTechNotes ? 'Hide' : 'Show'} Technician Notes
              </button>
              
              {showTechNotes && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                  {entry.technician_notes}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceDetailsView;
