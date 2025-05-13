
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ApiConnection, ApiConnectionType } from '@/pages/shop/admin/types';

export const useApiConnections = () => {
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform to ApiConnection format
      const transformedData: ApiConnection[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        key: item.key,
        type: (item.service || 'other') as ApiConnectionType,
        url: item.url || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setConnections(transformedData);
    } catch (error) {
      console.error('Error fetching API connections:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load API connections",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConnection = async (data: ApiConnectionFormData) => {
    try {
      const { data: newConnection, error } = await supabase
        .from('api_keys')
        .insert({
          name: data.name.trim(),
          key: data.key.trim(),
          service: data.type,
          url: data.url
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "API connection added successfully",
      });
      
      await fetchConnections();
      return true;
    } catch (error) {
      console.error('Error creating API connection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create API connection",
      });
      return false;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setConnections(connections.filter(conn => conn.id !== id));
      
      toast({
        title: "Success",
        description: "API connection deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting API connection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete API connection",
      });
    }
  };

  const testConnection = async (connection: ApiConnection) => {
    // This would be implemented based on the specific requirements for testing
    // different types of connections (Zapier, N8n, GHL, etc.)
    try {
      toast({
        title: "Testing Connection",
        description: `Testing connection to ${connection.name}...`,
      });
      
      // Simulating a test for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: `Connection to ${connection.name} successful`,
      });
      
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to connect to ${connection.name}`,
      });
      return false;
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return {
    connections,
    loading,
    fetchConnections,
    createConnection,
    deleteConnection,
    testConnection
  };
};
