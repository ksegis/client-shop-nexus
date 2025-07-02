
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  Calendar, 
  ClipboardList, 
  WrenchIcon,
  Users,
  BarChart4,
  PlusCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useServiceAppointments } from '@/hooks/useServiceAppointments';
import { useWorkOrders } from '@/pages/shop/work-orders/WorkOrdersContext';
import { useServiceHistory } from '@/hooks/useServiceHistory';
import { useCustomers } from '@/hooks/useCustomers';
import AppointmentsList from '@/components/service/AppointmentsList';
import ServiceHistoryList from '@/components/service/ServiceHistoryList';
import { WorkOrdersProvider } from './work-orders/WorkOrdersContext';
import { WorkOrdersTable } from './work-orders/WorkOrdersTable';
import { WorkOrderDialog } from './work-orders/WorkOrderDialog';
import AppointmentDialog from '@/components/service/AppointmentDialog';

const ServiceDesk = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { appointments, isLoading: appointmentsLoading } = useServiceAppointments();
  const { serviceHistory, isLoading: historyLoading } = useServiceHistory();
  const { customers } = useCustomers();
  
  // Filter appointments for today
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(
    appointment => appointment.appointment_date === today && appointment.status === 'scheduled'
  );
  
  // Get recent service history (last 5 entries)
  const recentHistory = serviceHistory.slice(0, 5);
  
  // Quick stats
  const upcomingAppointmentsCount = appointments.filter(app => app.status === 'scheduled').length;
  const activeWorkOrdersCount = 0; // This will be populated from workOrders context when available

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Desk</h1>
          <p className="text-muted-foreground">
            Manage service operations, appointments, and work orders
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <AppointmentDialog 
            buttonText="New Appointment" 
            buttonClassName="bg-shop-primary hover:bg-shop-primary/90"
          />
          <WorkOrdersProvider>
            <WorkOrderDialog />
          </WorkOrdersProvider>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Appointments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointmentsCount}</div>
            <p className="text-xs text-muted-foreground">
              Total scheduled appointments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Work Orders
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkOrdersCount}</div>
            <p className="text-xs text-muted-foreground">
              In progress and pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Tabs 
          defaultValue="dashboard" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="p-4 border-b">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="workorders">Work Orders</TabsTrigger>
              <TabsTrigger value="history">Service History</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Today's Appointments</h3>
                {appointmentsLoading ? (
                  <div className="text-center py-10">Loading appointments...</div>
                ) : (
                  todayAppointments.length > 0 ? (
                    <AppointmentsList 
                      appointments={todayAppointments} 
                      showCustomerInfo={true}
                    />
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-6 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <h4 className="font-medium mb-2">No appointments scheduled for today</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create a new appointment to get started.
                      </p>
                      <AppointmentDialog 
                        buttonText="Schedule Appointment" 
                        buttonVariant="outline"
                      />
                    </div>
                  )
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Service History</h3>
                {historyLoading ? (
                  <div className="text-center py-10">Loading service history...</div>
                ) : (
                  recentHistory.length > 0 ? (
                    <ServiceHistoryList serviceHistory={recentHistory} />
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-6 text-center">
                      <WrenchIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <h4 className="font-medium mb-2">No recent service history</h4>
                      <p className="text-sm text-muted-foreground">
                        Service records will appear here after work is completed.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="appointments" className="p-4">
            <div className="mb-4 flex justify-end">
              <AppointmentDialog 
                buttonText="Schedule New Appointment" 
                buttonClassName="bg-shop-primary hover:bg-shop-primary/90"
              />
            </div>
            {appointmentsLoading ? (
              <div className="text-center py-10">Loading appointments...</div>
            ) : (
              <AppointmentsList 
                appointments={appointments.filter(app => app.status === 'scheduled')} 
                showCustomerInfo={true}
                emptyMessage="No upcoming appointments scheduled."
              />
            )}
          </TabsContent>
          
          <TabsContent value="workorders" className="p-0">
            <WorkOrdersProvider>
              <div className="p-4 flex justify-end border-b">
                <WorkOrderDialog />
              </div>
              <WorkOrdersTable status="active" />
            </WorkOrdersProvider>
          </TabsContent>
          
          <TabsContent value="history" className="p-4">
            <h3 className="text-lg font-semibold mb-4">Service History</h3>
            {historyLoading ? (
              <div className="text-center py-10">Loading service history...</div>
            ) : (
              <ServiceHistoryList 
                serviceHistory={serviceHistory} 
                emptyMessage="No service history found."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceDesk;
