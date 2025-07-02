import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
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
    line_items?: any[]; // Add line_items to the type
  }) => Promise<void>;
  updateEstimate: (id: string, estimate: {
    title?: string;
    description?: string;
    total_amount?: number;
    status?: EstimateStatus;
    line_items?: any[]; // Add line_items to the type
  }) => Promise<void>;
  updateEstimateStatus: (id: string, status: EstimateStatus) => Promise<void>;
  deleteEstimate: (id: string) => Promise<void>;
  refreshEstimates: () => Promise<void>;
}

const EstimatesContext = createContext<EstimatesContextType | undefined>(undefined);

export function EstimatesProvider({ children }: { children: ReactNode }) {
  console.log("Initializing EstimatesProvider");
  
  try {
    // Use useEstimatesData hook to get access to all the data and functions
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
    
    console.log("EstimatesProvider loaded data:", { 
      estimatesCount: estimates?.length, 
      isLoading, 
      hasError: !!error 
    });
    
    // Create context value object outside of the jsx
    const contextValue = {
      estimates: estimates || [],
      isLoading,
      error,
      stats,
      createEstimate,
      updateEstimate,
      updateEstimateStatus,
      deleteEstimate,
      refreshEstimates
    };

    return (
      <EstimatesContext.Provider value={contextValue}>
        {children}
      </EstimatesContext.Provider>
    );
  } catch (error) {
    console.error("Error in EstimatesProvider:", error);
    // Provide a fallback value in case of error
    const fallbackValue: EstimatesContextType = {
      estimates: [],
      isLoading: false,
      error: error instanceof Error ? error : new Error(String(error)),
      stats: {
        pending: { count: 0, value: 0 },
        approved: { count: 0, value: 0 },
        declined: { count: 0, value: 0 },
        completed: { count: 0, value: 0 }
      },
      createEstimate: async () => { console.error("createEstimate not available"); },
      updateEstimate: async () => { console.error("updateEstimate not available"); },
      updateEstimateStatus: async () => { console.error("updateEstimateStatus not available"); },
      deleteEstimate: async () => { console.error("deleteEstimate not available"); },
      refreshEstimates: async () => { console.error("refreshEstimates not available"); }
    };
    
    return (
      <EstimatesContext.Provider value={fallbackValue}>
        {children}
      </EstimatesContext.Provider>
    );
  }
}

export function useEstimates(): EstimatesContextType {
  const context = useContext(EstimatesContext);
  if (context === undefined) {
    console.error("useEstimates must be used within an EstimatesProvider");
    throw new Error('useEstimates must be used within an EstimatesProvider');
  }
  return context;
}
