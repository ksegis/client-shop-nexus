
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, UserCheck, UserX, Activity } from 'lucide-react';
import { AdminUser } from '../types/adminTypes';

interface AdminDashboardProps {
  users: AdminUser[];
  isLoading: boolean;
}

export const AdminDashboard = ({ users, isLoading }: AdminDashboardProps) => {
  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.active).length;
  const deactivatedUsers = users.filter(user => !user.active).length;
  const customerCount = users.filter(user => user.role === 'customer').length;
  const staffCount = users.filter(user => user.role === 'staff').length;
  const adminCount = users.filter(user => user.role === 'admin').length;

  const metrics = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Deactivated',
      value: deactivatedUsers,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Admins',
      value: adminCount,
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Customers</span>
                <span className="text-sm text-muted-foreground">{customerCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Staff</span>
                <span className="text-sm text-muted-foreground">{staffCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Admins</span>
                <span className="text-sm text-muted-foreground">{adminCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">User management system active</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{totalUsers} total users in system</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
