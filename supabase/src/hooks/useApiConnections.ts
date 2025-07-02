
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ApiConnection {
  id: string;
  name: string;
  service: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

export const useApiConnections = () => {
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*');

      if (error) throw error;

      const mappedConnections: ApiConnection[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        service: item.service,
        status: 'connected' as const,
        lastSync: item.updated_at
      }));

      setConnections(mappedConnections);
    } catch (error) {
      console.error('Error fetching API connections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch API connections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    connections,
    loading,
    refetch: fetchConnections
  };
};
