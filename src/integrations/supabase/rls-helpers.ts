
import { supabase } from '@/integrations/supabase/client';

// Function to list RLS policies
export const fetchRlsPolicies = async () => {
  try {
    // Use a direct query instead of the RPC call
    const { data, error } = await supabase
      .from('rls_status')
      .select('*')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('Error fetching RLS policies:', err);
    return [];
  }
};

// Function to fetch RLS status for all tables
export const fetchRlsStatus = async () => {
  try {
    const { data, error } = await supabase.from('rls_status').select('*');
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('Error fetching RLS status:', err);
    return [];
  }
};

// Function to add public read policies to a table
export const addPublicReadPolicy = async (tableName: string) => {
  try {
    const { data, error } = await supabase.rpc(
      'add_public_read_policy', 
      { target_table: tableName }
    );
    
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error(`Error adding public read policy to ${tableName}:`, err);
    return false;
  }
};

// Function to add standard RLS policies to a table
export const addStandardPolicies = async (tableName: string) => {
  try {
    const { data, error } = await supabase.rpc(
      'add_standard_policies', 
      { target_table: tableName }
    );
    
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error(`Error adding standard policies to ${tableName}:`, err);
    return false;
  }
};
