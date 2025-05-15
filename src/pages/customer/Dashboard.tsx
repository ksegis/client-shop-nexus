
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useCustomerDashboard } from '@/hooks/customer/useCustomerDashboard';
import {
  DashboardHeader,
  QuickActions,
  NotificationsCard,
  ServiceStatusCard,
  PaymentSummaryCard
} from '@/components/customer/dashboard';

const CustomerDashboard = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    firstName, 
    notifications, 
    activeWorkOrder, 
    outstandingInvoice, 
    loading, 
    error 
  } = useCustomerDashboard();
  
  // If not authenticated and not currently loading auth status, redirect to login
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader firstName={firstName} loading={loading} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActions />
        <NotificationsCard notifications={notifications} loading={loading} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ServiceStatusCard activeWorkOrder={activeWorkOrder} loading={loading} />
        <PaymentSummaryCard outstandingInvoice={outstandingInvoice} loading={loading} />
      </div>
    </div>
  );
};

export default CustomerDashboard;
