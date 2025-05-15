
import { Card, CardContent } from '@/components/ui/card';
import { ServiceAppointment } from '@/hooks/useServiceAppointments';
import { CardHeader } from './CardHeader';
import { ServiceDetails } from './ServiceDetails';
import { CustomerInfo } from './CustomerInfo';
import { ContactInfo } from './ContactInfo';
import { CardFooter } from './CardFooter';

interface AppointmentCardProps {
  appointment: ServiceAppointment & {
    vehicles?: { make: string; model: string; year: number | string };
    profiles?: { first_name: string | null; last_name: string | null; email: string };
  };
  onCancel: (id: string) => Promise<void>;
  showCustomerInfo?: boolean;
}

const AppointmentCard = ({ appointment, onCancel, showCustomerInfo = false }: AppointmentCardProps) => {
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
  
  const isPast = new Date(`${appointment_date}T${appointment_time}`) < new Date();
  const canCancel = status === 'scheduled' && !isPast;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader 
        vehicleInfo={vehicles}
        appointmentDate={appointment_date}
        appointmentTime={appointment_time}
        status={status}
      />
      
      <CardContent className="py-2">
        <div className="space-y-4">
          <ServiceDetails 
            serviceType={service_type}
            description={description}
          />
          
          <CustomerInfo 
            customerInfo={profiles}
            showCustomerInfo={showCustomerInfo || false}
          />
          
          <ContactInfo 
            contactEmail={contact_email}
            contactPhone={contact_phone}
          />
        </div>
      </CardContent>
      
      <CardFooter 
        canCancel={canCancel} 
        onCancel={() => onCancel(id)} 
      />
    </Card>
  );
};

export default AppointmentCard;
