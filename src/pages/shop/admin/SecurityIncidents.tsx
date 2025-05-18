
import React from 'react';
import { useAuth } from '@/contexts/auth';
import { SecurityIncidentDashboard } from '@/components/admin/SecurityIncidentDashboard';
import { Navigate } from 'react-router-dom';

const SecurityIncidents = () => {
  const { profile } = useAuth();
  
  // Only allow admins to access this page
  if (profile?.role !== 'admin') {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Security Incidents</h2>
        <p className="text-muted-foreground">
          Review and resolve security incidents across the system
        </p>
      </div>

      <SecurityIncidentDashboard />
    </div>
  );
};

export default SecurityIncidents;
