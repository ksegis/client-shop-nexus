
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@/hooks/customer/useCustomerDashboard';

interface NotificationsCardProps {
  notifications: Notification[];
  loading: boolean;
}

export const NotificationsCard = ({ notifications, loading }: NotificationsCardProps) => {
  const { toast } = useToast();
  
  const handleNotificationClick = (notification: Notification) => {
    toast({
      title: notification.title,
      description: notification.message,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Recent updates on your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full mb-2" />
            <Skeleton className="h-20 w-full mb-2" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400">{notification.date}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No new notifications</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
