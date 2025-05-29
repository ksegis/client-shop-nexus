
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useServiceAppointments } from '@/hooks/useServiceAppointments';
import { format, addDays, addWeeks, addMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useState } from 'react';

type ViewType = 'daily' | 'weekly' | 'monthly';

const AppointmentsOverview = () => {
  const { appointments, isLoading } = useServiceAppointments();
  const [currentView, setCurrentView] = useState<ViewType>('daily');

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

  // Further separate into current (today for daily view) and upcoming
  const today = new Date().toISOString().split('T')[0];
  const currentAppointments = currentView === 'daily' 
    ? filteredAppointments.filter(appointment => appointment.appointment_date === today)
    : filteredAppointments.filter(appointment => appointment.appointment_date === today);
    
  const upcomingAppointments = currentView === 'daily'
    ? [] // No upcoming for daily view
    : filteredAppointments.filter(appointment => appointment.appointment_date > today);

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

      <div className={currentView === 'daily' ? 'grid gap-4' : 'grid gap-4 md:grid-cols-2'}>
        {/* Current Period Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {currentView === 'daily' ? 'Today\'s Appointments' : 'Current Appointments'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentAppointments.length > 0 ? (
              <div className="space-y-3">
                {currentAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                      <p className="font-medium">
                        {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.vehicles?.year} {appointment.vehicles?.make} {appointment.vehicles?.model}
                      </p>
                      <p className="text-sm text-gray-500">{appointment.service_type}</p>
                    </div>
                    <div className="text-sm">
                      {currentView !== 'daily' && (
                        <p className="font-medium">{format(new Date(appointment.appointment_date), 'MMM dd')}</p>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {appointment.appointment_time}
                      </div>
                    </div>
                  </div>
                ))}
                {currentAppointments.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    +{currentAppointments.length - 5} more appointments
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No appointments for {currentView === 'daily' ? 'today' : 'this period'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments (for weekly and monthly views) */}
        {currentView !== 'daily' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Upcoming in {title.replace('This ', '').replace('\'s Appointments', '')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between border-b last:border-0 py-2">
                      <div>
                        <p className="font-medium">
                          {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.vehicles?.year} {appointment.vehicles?.make} {appointment.vehicles?.model}
                        </p>
                        <p className="text-sm text-gray-500">{appointment.service_type}</p>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{format(new Date(appointment.appointment_date), 'MMM dd')}</p>
                        <p className="text-gray-500">{appointment.appointment_time}</p>
                      </div>
                    </div>
                  ))}
                  {upcomingAppointments.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{upcomingAppointments.length - 5} more appointments
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No upcoming appointments in this {currentView === 'weekly' ? 'week' : 'month'}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Appointments Summary for daily view */}
        {currentView === 'daily' && filteredAppointments.length > currentAppointments.length && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Total Scheduled Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-blue-600">
                  {filteredAppointments.length}
                </div>
                <p className="text-sm text-gray-500">appointments scheduled</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AppointmentsOverview;
