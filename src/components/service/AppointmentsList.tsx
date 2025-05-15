
import { ServiceAppointment, useServiceAppointments } from '@/hooks/useServiceAppointments';
import { AppointmentCard } from './appointment-card';

interface AppointmentsListProps {
  appointments: ServiceAppointment[];
  showCustomerInfo?: boolean;
  emptyMessage?: string;
}

const AppointmentsList = ({ 
  appointments, 
  showCustomerInfo = false,
  emptyMessage = "No appointments scheduled."
}: AppointmentsListProps) => {
  const { cancelAppointment } = useServiceAppointments();

  const handleCancelAppointment = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      await cancelAppointment(id);
    }
  };

  if (!appointments || appointments.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {appointments.map((appointment) => (
        <AppointmentCard 
          key={appointment.id} 
          appointment={appointment}
          onCancel={handleCancelAppointment}
          showCustomerInfo={showCustomerInfo}
        />
      ))}
    </div>
  );
};

export default AppointmentsList;
