
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServiceAppointments } from '@/hooks/useServiceAppointments';
import AppointmentsList from '@/components/service/AppointmentsList';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2 } from 'lucide-react';
import AppointmentDialog from '@/components/service/AppointmentDialog';
import { useState } from 'react';

const CustomerServiceAppointments = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { customerAppointments, isLoading } = useServiceAppointments();
  
  // Filter appointments based on the active tab
  const upcomingAppointments = customerAppointments.filter(
    appointment => appointment.status === 'scheduled'
  );
  
  const pastAppointments = customerAppointments.filter(
    appointment => appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show'
  );

  return (
    <Layout portalType="customer">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Appointments</h1>
          <p className="text-muted-foreground">
            Schedule and manage your service appointments
          </p>
        </div>
        
        <div className="flex justify-end">
          <AppointmentDialog 
            buttonText="Schedule New Appointment" 
            buttonClassName="bg-shop-primary hover:bg-shop-primary/90"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
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
                  <TabsTrigger value="past">Past Appointments</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="upcoming" className="p-4">
                <AppointmentsList 
                  appointments={upcomingAppointments}
                  emptyMessage="You don't have any upcoming appointments. Schedule one today!"
                />
              </TabsContent>
              
              <TabsContent value="past" className="p-4">
                <AppointmentsList 
                  appointments={pastAppointments}
                  emptyMessage="You don't have any past appointments."
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CustomerServiceAppointments;
