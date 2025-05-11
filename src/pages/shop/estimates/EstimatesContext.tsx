
import React, { createContext, useContext, ReactNode } from 'react';
import { Estimate } from './types/estimateTypes';
import { EstimateFormValues } from './schemas/estimateSchema';
import { useEstimatesData } from './hooks/useEstimatesData';

interface EstimatesContextType {
  estimates: Estimate[];
  isLoading: boolean;
  error: Error | null;
  createEstimate: (estimate: EstimateFormValues) => Promise<void>;
  updateEstimate: (id: string, estimate: Partial<Estimate>) => Promise<void>;
  updateEstimateStatus: (id: string, status: any) => Promise<void>;
  deleteEstimate: (id: string) => Promise<void>;
  refreshEstimates: () => Promise<void>;
}

const EstimatesContext = createContext<EstimatesContextType | undefined>(undefined);

export function EstimatesProvider({ children }: { children: ReactNode }) {
  const estimatesData = useEstimatesData();
  
  return (
    <EstimatesContext.Provider value={estimatesData}>
      {children}
    </EstimatesContext.Provider>
  );
}

export function useEstimates() {
  const context = useContext(EstimatesContext);
  if (context === undefined) {
    throw new Error('useEstimates must be used within a EstimatesProvider');
  }
  return context;
}

export type { Estimate } from './types/estimateTypes';
