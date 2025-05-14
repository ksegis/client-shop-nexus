
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/pages/shop/inventory/types';
import { handleRlsError } from '@/integrations/supabase/client';

/**
 * Hook for fetching inventory data with RLS awareness
 * This hook will track RLS-related errors and provide troubleshooting utilities
 */
export const useRlsAwareInventoryData = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [troubleshootingMode, setTroubleshootingMode] = useState(false);
  const [fixAttempted, setFixAttempted] = useState(false);
  
  // Fetch inventory data
  const { 
    data: inventoryItems = [], 
    isLoading, 
    error: fetchError, 
    refetch 
  } = useQuery({
    queryKey: ['inventory-with-rls'],
    queryFn: async () => {
      try {
        console.log('Fetching inventory with RLS awareness...');
        console.log('Current user:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not authenticated');
        
        // Try to fetch inventory data
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching inventory:', error);
          
          // Check if error is RLS related
          const isRlsError = handleRlsError(error, toast);
          if (isRlsError) {
            setTroubleshootingMode(true);
            throw new Error(`Row Level Security permission denied`);
          }
          
          throw error;
        }
        
        if (data && data.length === 0) {
          console.info('No inventory items found, but query succeeded');
        }
        
        return data as InventoryItem[];
      } catch (err) {
        console.error('Error in inventory data query:', err);
        throw err;
      }
    },
    retry: false,
    enabled: !!user,
  });
  
  // Check RLS configuration
  const { data: rlsConfig, isLoading: isLoadingRls } = useQuery({
    queryKey: ['rls-config'],
    queryFn: async () => {
      try {
        // Check if user is authenticated
        if (!user) return { enabled: false, hasPermission: false };
        
        console.log('Checking RLS configuration...');
        
        // Get tables with RLS enabled
        const { data: rlsStatus, error: rlsError } = await supabase
          .from('rls_status')
          .select('*')
          .eq('table_name', 'inventory');
        
        if (rlsError) {
          console.error('Error checking RLS status:', rlsError);
          return { enabled: false, hasPermission: false, error: rlsError.message };
        }
        
        // Try a simple count query to check if we have read permission
        const { count, error: countError } = await supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true });
        
        console.log('Inventory count check:', count !== null ? count : 'Error');
        
        return {
          enabled: rlsStatus && rlsStatus[0]?.row_security_active === true,
          hasPermission: !countError,
          error: countError?.message
        };
      } catch (err: any) {
        console.error('Error checking RLS configuration:', err);
        return { 
          enabled: false, 
          hasPermission: false, 
          error: err.message 
        };
      }
    },
    enabled: troubleshootingMode,
  });
  
  // Temporary RLS disable mutation (for admin use only)
  const disableRls = useMutation({
    mutationFn: async () => {
      try {
        console.log('Attempting to temporarily disable RLS...');
        
        if (!user) {
          throw new Error('Must be authenticated to manage RLS');
        }
        
        // Try to disable RLS using a database function
        // This should be restricted to admins only via RLS on the function itself
        const { data, error } = await supabase.rpc('disable_all_rls');
        
        if (error) throw error;
        
        console.log('RLS disabled successfully:', data);
        setFixAttempted(true);
        
        // Refetch inventory data
        setTimeout(() => {
          refetch();
        }, 500);
        
        return true;
      } catch (err: any) {
        console.error('Error disabling RLS:', err);
        toast({
          variant: "destructive",
          title: "Permission Error",
          description: "You don't have permission to disable RLS.",
        });
        return false;
      }
    }
  });
  
  // Add standard RLS policies mutation
  const addStandardPolicies = useMutation({
    mutationFn: async () => {
      try {
        console.log('Attempting to add standard RLS policies...');
        
        if (!user) {
          throw new Error('Must be authenticated to manage RLS');
        }
        
        // Add standard RLS policies to inventory table
        const { data, error } = await supabase.rpc(
          'add_public_read_policy', 
          { target_table: 'inventory' }
        );
        
        if (error) throw error;
        
        console.log('Standard RLS policies added:', data);
        setFixAttempted(true);
        
        // Refetch inventory data
        setTimeout(() => {
          refetch();
        }, 500);
        
        return true;
      } catch (err: any) {
        console.error('Error adding RLS policies:', err);
        toast({
          variant: "destructive",
          title: "Permission Error",
          description: "You don't have permission to modify RLS policies.",
        });
        return false;
      }
    }
  });
  
  // List policies mutation (for troubleshooting)
  const listPolicies = useMutation({
    mutationFn: async () => {
      try {
        console.log('Listing RLS policies...');
        
        if (!user) {
          throw new Error('Must be authenticated to list policies');
        }
        
        // Get RLS policies using a custom query since we can't access pg_policies directly
        const { data, error } = await supabase.rpc('list_policies');
        
        if (error) throw error;
        
        console.log('RLS policies:', data);
        return data || [];
      } catch (err: any) {
        console.error('Error listing policies:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to list RLS policies.",
        });
        return [];
      }
    }
  });

  // Determine if we have an RLS issue
  const hasRlsIssue = troubleshootingMode && 
    rlsConfig && 
    (rlsConfig.enabled && !rlsConfig.hasPermission);
  
  return {
    inventoryItems,
    isLoading,
    fetchError,
    refetch,
    troubleshootingMode,
    setTroubleshootingMode,
    rlsConfig,
    isLoadingRls,
    hasRlsIssue,
    fixAttempted,
    disableRls,
    addStandardPolicies,
    listPolicies
  };
};
