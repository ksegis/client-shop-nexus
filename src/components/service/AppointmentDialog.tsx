
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import AppointmentForm from './AppointmentForm';
import { NewAppointmentData, useServiceAppointments } from '@/hooks/useServiceAppointments';

interface AppointmentDialogProps {
  customerId?: string;
  buttonText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonClassName?: string;
}

const AppointmentDialog = ({ 
  customerId, 
  buttonText = "Schedule Service", 
  buttonVariant = "default", 
  buttonClassName = ""
}: AppointmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const { createAppointment, isLoading } = useServiceAppointments();

  const handleSubmit = async (data: NewAppointmentData) => {
    try {
      await createAppointment(data);
      setOpen(false);
    } catch (error) {
      console.error("Error scheduling appointment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          className={buttonClassName}
          disabled={isLoading}
        >
          <Calendar className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule a Service Appointment</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AppointmentForm onSubmit={handleSubmit} customerId={customerId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDialog;
