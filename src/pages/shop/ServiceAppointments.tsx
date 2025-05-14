
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServiceAppointments } from '@/hooks/useServiceAppointments';
import AppointmentsList from '@/components/service/AppointmentsList';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';
import AppointmentDialog from '@/components/service/AppointmentDialog';

const ServiceAppointments = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { appointments, isLoading, refetch } = useServiceAppointments();
  
  // Filter appointments based on the active tab
  const upcomingAppointments = appointments.filter(
    appointment => appointment.status === 'scheduled'
  );
  
  const completedAppointments = appointments.filter(
    appointment => appointment.status === 'completed'
  );
  
  const cancelledAppointments = appointments.filter(
    appointment => appointment.status === 'cancelled' || appointment.status === 'no_show'
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Appointments</h1>
          <p className="text-muted-foreground">
            Manage service appointments and scheduling
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <AppointmentDialog 
            buttonText="Create Appointment" 
            buttonClassName="bg-shop-primary hover:bg-shop-primary/90"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Tabs 
          defaultValue="upcoming" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="p-4 border-b">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upcoming" className="p-4">
            {isLoading ? (
              <div className="text-center py-10">Loading appointments...</div>
            ) : (
              <AppointmentsList 
                appointments={upcomingAppointments} 
                showCustomerInfo={true}
                emptyMessage="No upcoming appointments scheduled."
              />
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="p-4">
            {isLoading ? (
              <div className="text-center py-10">Loading appointments...</div>
            ) : (
              <AppointmentsList 
                appointments={completedAppointments} 
                showCustomerInfo={true}
                emptyMessage="No completed appointments."
              />
            )}
          </TabsContent>
          
          <TabsContent value="cancelled" className="p-4">
            {isLoading ? (
              <div className="text-center py-10">Loading appointments...</div>
            ) : (
              <AppointmentsList 
                appointments={cancelledAppointments} 
                showCustomerInfo={true}
                emptyMessage="No cancelled appointments."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceAppointments;
