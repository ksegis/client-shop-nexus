
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardHeaderProps {
  firstName: string;
  loading: boolean;
}

export const DashboardHeader = ({ firstName, loading }: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      {loading ? (
        <Skeleton className="h-10 w-64" />
      ) : (
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {firstName || 'Customer'}
        </h1>
      )}
    </div>
  );
};
