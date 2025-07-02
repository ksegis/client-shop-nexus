
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useServiceAppointments } from '@/hooks/useServiceAppointments';
import { format, addDays, addWeeks, addMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type ViewType = 'daily' | 'weekly' | 'monthly';

const AppointmentsOverview = () => {
  const { appointments, isLoading } = useServiceAppointments();
  const [currentView, setCurrentView] = useState<ViewType>('daily');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Loading appointments...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDateRange = () => {
    const today = new Date();
    const startDate = startOfDay(today);
    
    switch (currentView) {
      case 'daily':
        return {
          start: startDate,
          end: endOfDay(today),
          title: 'Today\'s Appointments'
        };
      case 'weekly':
        return {
          start: startDate,
          end: endOfDay(addDays(today, 6)),
          title: 'This Week\'s Appointments'
        };
      case 'monthly':
        return {
          start: startDate,
          end: endOfDay(addMonths(today, 1)),
          title: 'This Month\'s Appointments'
        };
      default:
        return {
          start: startDate,
          end: endOfDay(today),
          title: 'Today\'s Appointments'
        };
    }
  };

  const { start, end, title } = getDateRange();

  // Filter appointments based on current view
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointment_date);
    return isWithinInterval(appointmentDate, { start, end }) && 
           appointment.status === 'scheduled';
  });

  // Group appointments by status/time
  const today = new Date().toISOString().split('T')[0];
  const currentAppointments = filteredAppointments.filter(appointment => 
    appointment.appointment_date === today
  );
  const upcomingAppointments = filteredAppointments.filter(appointment => 
    appointment.appointment_date > today
  );
  const totalAppointments = filteredAppointments.length;

  // Create summary cards data
  const summaryCards = [
    {
      id: 'total',
      title: `Total ${currentView === 'daily' ? 'Today' : title.replace('\'s Appointments', '')}`,
      count: totalAppointments,
      icon: Calendar,
      color: 'bg-blue-500',
      appointments: filteredAppointments
    },
    {
      id: 'current',
      title: currentView === 'daily' ? 'Today\'s Appointments' : 'Current Appointments',
      count: currentAppointments.length,
      icon: Clock,
      color: 'bg-green-500',
      appointments: currentAppointments
    },
    ...(currentView !== 'daily' ? [{
      id: 'upcoming',
      title: 'Upcoming Appointments',
      count: upcomingAppointments.length,
      icon: AlertCircle,
      color: 'bg-orange-500',
      appointments: upcomingAppointments
    }] : [])
  ];

  const selectedCardData = summaryCards.find(card => card.id === selectedCard);

  return (
    <div className="space-y-4">
      {/* View Selection */}
      <div className="flex gap-2">
        <Button
          variant={currentView === 'daily' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentView('daily')}
        >
          Daily
        </Button>
        <Button
          variant={currentView === 'weekly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentView('weekly')}
        >
          Weekly
        </Button>
        <Button
          variant={currentView === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentView('monthly')}
        >
          Monthly
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card 
              key={card.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCard(card.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.count}</div>
                <p className="text-xs text-muted-foreground">
                  {card.count === 1 ? 'appointment' : 'appointments'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCardData?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCardData?.appointments && selectedCardData.appointments.length > 0 ? (
              selectedCardData.appointments.map((appointment) => (
                <Card key={appointment.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {appointment.vehicles?.year} {appointment.vehicles?.make} {appointment.vehicles?.model}
                        </p>
                      </div>
                      <Badge variant="outline">{appointment.status}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.appointment_time}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Service Type:</p>
                      <p className="text-sm text-gray-600">{appointment.service_type}</p>
                    </div>
                    
                    {appointment.description && (
                      <div>
                        <p className="text-sm font-medium">Description:</p>
                        <p className="text-sm text-gray-600">{appointment.description}</p>
                      </div>
                    )}
                    
                    {(appointment.contact_email || appointment.contact_phone) && (
                      <div>
                        <p className="text-sm font-medium">Contact:</p>
                        <div className="text-sm text-gray-600">
                          {appointment.contact_email && <p>Email: {appointment.contact_email}</p>}
                          {appointment.contact_phone && <p>Phone: {appointment.contact_phone}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No appointments found for this period
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsOverview;
