
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TestResult, TestStatus, TestPriority } from '@/types/testing';
import { useAuth } from '@/contexts/auth';

export interface TestResultFilter {
  status?: TestStatus;
  feature_area?: string;
  tester_id?: string;
  priority?: TestPriority;
}

export const useTestResults = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTestResults = async (filters?: TestResultFilter) => {
    setIsLoading(true);
    setError('');

    try {
      // Use the "test_results" table directly in TypeScript, after it's been created in SQL
      let query = supabase.from('test_results').select('*');

      // Apply filters if provided
      if (filters) {
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.feature_area) query = query.eq('feature_area', filters.feature_area);
        if (filters.tester_id) query = query.eq('tester_id', filters.tester_id);
        if (filters.priority) query = query.eq('priority', filters.priority);
      }

      // Order by created_at in descending order (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setTestResults(data as TestResult[] || []);
    } catch (err) {
      console.error('Error fetching test results:', err);
      setError('Failed to load test results');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load test results',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTestResult = async (newTest: Omit<TestResult, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('test_results')
        .insert({
          ...newTest,
          tester_id: newTest.tester_id || user?.id || '',
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Test Result Added',
        description: 'The test result has been successfully recorded',
      });

      // Refresh the list
      await fetchTestResults();
      return data?.[0] as TestResult;
    } catch (err) {
      console.error('Error adding test result:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add test result',
      });
      return null;
    }
  };

  const updateTestResult = async (id: string, updates: Partial<TestResult>) => {
    try {
      const { error: updateError } = await supabase
        .from('test_results')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Test Result Updated',
        description: 'The test result has been successfully updated',
      });

      // Refresh the list
      await fetchTestResults();
      return true;
    } catch (err) {
      console.error('Error updating test result:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update test result',
      });
      return false;
    }
  };

  const deleteTestResult = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('test_results')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: 'Test Result Deleted',
        description: 'The test result has been successfully deleted',
      });

      // Refresh the list
      await fetchTestResults();
      return true;
    } catch (err) {
      console.error('Error deleting test result:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete test result',
      });
      return false;
    }
  };

  // Load test results on component mount
  useEffect(() => {
    fetchTestResults();
  }, []);

  return {
    testResults,
    isLoading,
    error,
    fetchTestResults,
    addTestResult,
    updateTestResult,
    deleteTestResult,
  };
};
