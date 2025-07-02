
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Car, FileText, AlertCircle, Mail, Phone } from 'lucide-react';
import { ServiceAppointment } from '@/hooks/useServiceAppointments';

interface AppointmentCardProps {
  appointment: ServiceAppointment & {
    vehicles?: { make: string; model: string; year: number | string };
    profiles?: { first_name: string | null; last_name: string | null; email: string };
  };
  onCancel: (id: string) => Promise<void>;
  showCustomerInfo?: boolean;
}

const ServiceTypeBadge = ({ type }: { type: string }) => {
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

const StatusBadge = ({ status }: { status: string }) => {
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

const AppointmentCard = ({ appointment, onCancel, showCustomerInfo }: AppointmentCardProps) => {
  const { 
    id, 
    appointment_date, 
    appointment_time, 
    service_type, 
    description, 
    status, 
    vehicles, 
    profiles,
    contact_email,
    contact_phone
  } = appointment;
  
  const formattedDate = format(new Date(appointment_date), 'PPP');
  const isPast = new Date(`${appointment_date}T${appointment_time}`) < new Date();
  const canCancel = status === 'scheduled' && !isPast;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl">{vehicles ? `${vehicles.year} ${vehicles.make} ${vehicles.model}` : 'Vehicle Service'}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formattedDate}
                <span className="mx-1">•</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
                {appointment_time}
              </div>
            </CardDescription>
          </div>
          
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      
      <CardContent className="py-2">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Service Type:</span>
            </div>
            <ServiceTypeBadge type={service_type} />
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
          
          {showCustomerInfo && profiles && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Customer:</span>
              </div>
              <p className="text-sm">
                {profiles.first_name} {profiles.last_name} 
                <span className="text-muted-foreground"> • {profiles.email}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contact_email && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Contact Email:</span>
                </div>
                <p className="text-sm text-muted-foreground">{contact_email}</p>
              </div>
            )}
            
            {contact_phone && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Contact Phone:</span>
                </div>
                <p className="text-sm text-muted-foreground">{contact_phone}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3">
        {canCancel && (
          <Button 
            variant="outline" 
            onClick={() => onCancel(id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Cancel Appointment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AppointmentCard;
