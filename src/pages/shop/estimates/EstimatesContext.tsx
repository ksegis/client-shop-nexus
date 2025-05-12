
import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Estimate, EstimateStatus, EstimateStats } from './types';
import { useEstimatesData } from './hooks/useEstimatesData';

interface EstimatesContextType {
  estimates: Estimate[];
  isLoading: boolean;
  error: Error | null;
  stats: EstimateStats;
  createEstimate: (estimate: {
    customer_id: string;
    vehicle_id: string;
    title: string;
    description?: string;
    total_amount?: number;
    status?: EstimateStatus;
  }) => Promise<void>;
  updateEstimate: (id: string, estimate: {
    title?: string;
    description?: string;
    total_amount?: number;
    status?: EstimateStatus;
  }) => Promise<void>;
  updateEstimateStatus: (id: string, status: EstimateStatus) => Promise<void>;
  deleteEstimate: (id: string) => Promise<void>;
  refreshEstimates: () => Promise<void>;
}

const EstimatesContext = createContext<EstimatesContextType | undefined>(undefined);

export function EstimatesProvider({ children }: { children: ReactNode }) {
  const { 
    estimates,
    isLoading, 
    error, 
    stats,
    createEstimate, 
    updateEstimate, 
    updateEstimateStatus, 
    deleteEstimate, 
    refreshEstimates 
  } = useEstimatesData();
  
  return (
    <EstimatesContext.Provider
      value={{
        estimates,
        isLoading,
        error,
        stats,
        createEstimate,
        updateEstimate,
        updateEstimateStatus,
        deleteEstimate,
        refreshEstimates
      }}
    >
      {children}
    </EstimatesContext.Provider>
  );
}

export function useEstimates() {
  const context = useContext(EstimatesContext);
  if (context === undefined) {
    throw new Error('useEstimates must be used within an EstimatesProvider');
  }
  return context;
}
