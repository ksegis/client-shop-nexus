
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { useServiceAppointments } from '@/hooks/useServiceAppointments';
import { format } from 'date-fns';

const AppointmentsOverview = () => {
  const { appointments, isLoading } = useServiceAppointments();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Loading appointments...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(
    appointment => appointment.appointment_date === today && appointment.status === 'scheduled'
  );

  // Filter upcoming appointments (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingAppointments = appointments.filter(
    appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      return appointmentDate > new Date() && 
             appointmentDate <= nextWeek && 
             appointment.status === 'scheduled';
    }
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length > 0 ? (
            <div className="space-y-3">
              {todayAppointments.slice(0, 3).map((appointment) => (
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
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    {appointment.appointment_time}
                  </div>
                </div>
              ))}
              {todayAppointments.length > 3 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  +{todayAppointments.length - 3} more appointments
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No appointments scheduled for today
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Upcoming This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 3).map((appointment) => (
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
              {upcomingAppointments.length > 3 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  +{upcomingAppointments.length - 3} more appointments
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No upcoming appointments this week
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentsOverview;
