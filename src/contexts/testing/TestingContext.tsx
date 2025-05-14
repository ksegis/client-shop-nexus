
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useTestResults } from '@/hooks/testing/useTestResults';
import { useBugs } from '@/hooks/testing/useBugs';
import { TestResult, Bug } from '@/types/testing';

interface TestingContextType {
  isTestingEnabled: boolean;
  enableTesting: () => void;
  disableTesting: () => void;
  testResults: TestResult[];
  bugs: Bug[];
  isLoadingTestResults: boolean;
  isLoadingBugs: boolean;
  testResultsError: string;
  bugsError: string;
  refreshTestResults: () => Promise<void>;
  refreshBugs: () => Promise<void>;
  addTestResult: (newTest: Omit<TestResult, 'id' | 'created_at' | 'updated_at'>) => Promise<TestResult | null>;
  updateTestResult: (id: string, updates: Partial<TestResult>) => Promise<boolean>;
  deleteTestResult: (id: string) => Promise<boolean>;
  addBug: (newBug: Omit<Bug, 'id' | 'created_at' | 'updated_at'>) => Promise<Bug | null>;
  updateBug: (id: string, updates: Partial<Bug>) => Promise<boolean>;
  deleteBug: (id: string) => Promise<boolean>;
}

const TestingContext = createContext<TestingContextType | undefined>(undefined);

export function TestingProvider({ children }: { children: ReactNode }) {
  const [isTestingEnabled, setIsTestingEnabled] = useState(() => {
    // Check local storage for saved preference
    const savedPreference = localStorage.getItem('testing_enabled');
    return savedPreference ? savedPreference === 'true' : false;
  });

  const {
    testResults,
    isLoading: isLoadingTestResults,
    error: testResultsError,
    fetchTestResults,
    addTestResult,
    updateTestResult,
    deleteTestResult,
  } = useTestResults();

  const {
    bugs,
    isLoading: isLoadingBugs,
    error: bugsError,
    fetchBugs,
    addBug,
    updateBug,
    deleteBug,
  } = useBugs();

  const enableTesting = () => {
    setIsTestingEnabled(true);
    localStorage.setItem('testing_enabled', 'true');
  };

  const disableTesting = () => {
    setIsTestingEnabled(false);
    localStorage.setItem('testing_enabled', 'false');
  };

  // Only provide the context value if testing is enabled
  const value = {
    isTestingEnabled,
    enableTesting,
    disableTesting,
    testResults,
    bugs,
    isLoadingTestResults,
    isLoadingBugs,
    testResultsError,
    bugsError,
    refreshTestResults: fetchTestResults,
    refreshBugs: fetchBugs,
    addTestResult,
    updateTestResult,
    deleteTestResult,
    addBug,
    updateBug,
    deleteBug,
  };

  return <TestingContext.Provider value={value}>{children}</TestingContext.Provider>;
}

export function useTesting() {
  const context = useContext(TestingContext);
  if (context === undefined) {
    throw new Error('useTesting must be used within a TestingProvider');
  }
  return context;
}

// Export the context
export const TestingContextExport = TestingContext;
