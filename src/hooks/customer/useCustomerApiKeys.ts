
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

export interface CustomerApiKey {
  id: string;
  customer_id: string;
  key_name: string;
  api_key: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useCustomerApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<CustomerApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching customer API keys:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load API keys",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async (keyName: string, expiresInDays?: number) => {
    if (!keyName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Key name is required",
      });
      return null;
    }

    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated",
      });
      return null;
    }
    
    try {
      // Generate the API key using the database function
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_api_key');
      
      if (keyError) throw keyError;
      
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      const { data, error } = await supabase
        .from('customer_api_keys')
        .insert({
          customer_id: user.id,
          key_name: keyName.trim(),
          api_key: keyData,
          expires_at: expiresAt,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "API key generated successfully",
      });
      
      await fetchApiKeys();
      return data;
    } catch (error: any) {
      console.error('Error generating API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate API key",
      });
      return null;
    }
  };

  const toggleApiKey = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('customer_api_keys')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `API key ${isActive ? 'activated' : 'deactivated'}`,
      });
      
      await fetchApiKeys();
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update API key status",
      });
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customer_api_keys')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setApiKeys(apiKeys.filter(key => key.id !== id));
      
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete API key",
      });
    }
  };

  const updateLastUsed = async (apiKey: string) => {
    try {
      await supabase
        .from('customer_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('api_key', apiKey)
        .eq('is_active', true);
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return {
    apiKeys,
    loading,
    fetchApiKeys,
    generateApiKey,
    toggleApiKey,
    deleteApiKey,
    updateLastUsed
  };
};
