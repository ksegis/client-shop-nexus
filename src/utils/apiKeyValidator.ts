
import { supabase } from '@/lib/supabase';

export interface ApiKeyValidationResult {
  isValid: boolean;
  customerId?: string;
  keyName?: string;
  error?: string;
}

export const validateApiKey = async (apiKey: string): Promise<ApiKeyValidationResult> => {
  if (!apiKey) {
    return { isValid: false, error: 'API key is required' };
  }

  // Check if the API key format is valid
  if (!apiKey.startsWith('ctc_') || apiKey.length !== 68) {
    return { isValid: false, error: 'Invalid API key format' };
  }

  try {
    const { data, error } = await supabase
      .from('customer_api_keys')
      .select('customer_id, key_name, is_active, expires_at')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { isValid: false, error: 'Invalid API key' };
    }

    // Check if the key has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { isValid: false, error: 'API key has expired' };
    }

    // Update last used timestamp
    await supabase
      .from('customer_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('api_key', apiKey);

    return {
      isValid: true,
      customerId: data.customer_id,
      keyName: data.key_name
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { isValid: false, error: 'Failed to validate API key' };
  }
};

export const extractApiKeyFromRequest = (request: Request): string | null => {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter
  const url = new URL(request.url);
  const apiKeyParam = url.searchParams.get('api_key');
  if (apiKeyParam) {
    return apiKeyParam;
  }

  return null;
};
