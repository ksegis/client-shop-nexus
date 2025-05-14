
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bug, BugStatus, TestSeverity } from '@/types/testing';
import { useAuth } from '@/contexts/auth';

export interface BugFilter {
  status?: BugStatus;
  feature_area?: string;
  reported_by?: string;
  assigned_to?: string;
  severity?: TestSeverity;
}

export const useBugs = () => {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBugs = async (filters?: BugFilter) => {
    setIsLoading(true);
    setError('');

    try {
      let query = supabase.from('bugs').select('*');

      // Apply filters if provided
      if (filters) {
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.feature_area) query = query.eq('feature_area', filters.feature_area);
        if (filters.reported_by) query = query.eq('reported_by', filters.reported_by);
        if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
        if (filters.severity) query = query.eq('severity', filters.severity);
      }

      // Order by created_at in descending order (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setBugs(data || []);
    } catch (err) {
      console.error('Error fetching bugs:', err);
      setError('Failed to load bugs');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load bugs',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addBug = async (newBug: Omit<Bug, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('bugs')
        .insert({
          ...newBug,
          reported_by: newBug.reported_by || user?.id || '',
        })
        .select();

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Bug Added',
        description: 'The bug has been successfully recorded',
      });

      // Refresh the list
      await fetchBugs();
      return data?.[0];
    } catch (err) {
      console.error('Error adding bug:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add bug',
      });
      return null;
    }
  };

  const updateBug = async (id: string, updates: Partial<Bug>) => {
    try {
      const { error: updateError } = await supabase
        .from('bugs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Bug Updated',
        description: 'The bug has been successfully updated',
      });

      // Refresh the list
      await fetchBugs();
      return true;
    } catch (err) {
      console.error('Error updating bug:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update bug',
      });
      return false;
    }
  };

  const deleteBug = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('bugs')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: 'Bug Deleted',
        description: 'The bug has been successfully deleted',
      });

      // Refresh the list
      await fetchBugs();
      return true;
    } catch (err) {
      console.error('Error deleting bug:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete bug',
      });
      return false;
    }
  };

  // Load bugs on component mount
  useEffect(() => {
    fetchBugs();
  }, []);

  return {
    bugs,
    isLoading,
    error,
    fetchBugs,
    addBug,
    updateBug,
    deleteBug,
  };
};
