import { useState, useEffect, useCallback } from 'react';
import keystoneService from '../services/keystoneService';

interface UseKeystoneResult {
  isConfigured: boolean;
  environment: string;
  healthStatus: 'checking' | 'healthy' | 'unhealthy' | 'unknown';
  searchParts: (query: string) => Promise<any>;
  getPartDetails: (partNumber: string) => Promise<any>;
  checkInventory: (partNumber: string) => Promise<any>;
  getPricing: (partNumber: string) => Promise<any>;
  checkHealth: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useKeystone = (): UseKeystoneResult => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setHealthStatus('checking');
    try {
      const result = await keystoneService.healthCheck();
      setHealthStatus(result.success ? 'healthy' : 'unhealthy');
      if (!result.success) {
        setError(result.error || 'Health check failed');
      } else {
        setError(null);
      }
    } catch (err) {
      setHealthStatus('unhealthy');
      setError(err instanceof Error ? err.message : 'Health check failed');
    }
  }, []);

  const searchParts = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await keystoneService.searchParts(query);
      if (!result.success) {
        setError(result.error || 'Search failed');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPartDetails = useCallback(async (partNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await keystoneService.getPartDetails(partNumber);
      if (!result.success) {
        setError(result.error || 'Failed to get part details');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get part details';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkInventory = useCallback(async (partNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await keystoneService.checkInventory(partNumber);
      if (!result.success) {
        setError(result.error || 'Failed to check inventory');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check inventory';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPricing = useCallback(async (partNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await keystoneService.getPricing(partNumber);
      if (!result.success) {
        setError(result.error || 'Failed to get pricing');
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pricing';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Check health on mount if configured
  useEffect(() => {
    if (keystoneService.isConfigured()) {
      checkHealth();
    }
  }, [checkHealth]);

  return {
    isConfigured: keystoneService.isConfigured(),
    environment: keystoneService.getEnvironment(),
    healthStatus,
    searchParts,
    getPartDetails,
    checkInventory,
    getPricing,
    checkHealth,
    loading,
    error
  };
};

export default useKeystone;

