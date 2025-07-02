
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  created_at: string;
  updated_at: string;
}

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load API keys",
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (newKeyName: string, newKeyService: string, newKey: string) => {
    if (!newKeyName.trim() || !newKeyService || !newKey.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields are required",
      });
      return false;
    }
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName.trim(),
          key: newKey.trim(),
          service: newKeyService,
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "API key added successfully",
      });
      
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create API key",
      });
      return false;
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
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

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return {
    apiKeys,
    loading,
    fetchApiKeys,
    createApiKey,
    deleteApiKey
  };
};
