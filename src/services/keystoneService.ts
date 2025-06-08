// Keystone API Service with DigitalOcean Proxy Integration
interface KeystoneConfig {
  proxyUrl: string;
  apiToken: string;
  environment: string;
  accountNumber: string;
  securityToken: string;
}

interface KeystoneResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

class KeystoneService {
  private config: KeystoneConfig;

  constructor() {
    this.config = {
      proxyUrl: process.env.KEYSTONE_PROXY_URL || '',
      apiToken: process.env.KEYSTONE_API_TOKEN || '',
      environment: process.env.APP_ENVIRONMENT || 'development',
      accountNumber: process.env.KEYSTONE_ACCOUNT_NUMBER || '',
      securityToken: process.env.KEYSTONE_SECURITY_TOKEN || ''
    };

    if (!this.config.proxyUrl || !this.config.apiToken) {
      console.warn('Keystone service not properly configured');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<KeystoneResponse<T>> {
    try {
      const url = `${this.config.proxyUrl}/keystone-api/${endpoint}`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiToken,
      };

      const requestOptions: RequestInit = {
        method,
        headers,
        mode: 'cors',
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
      }

      console.log(`Keystone API Call: ${method} ${url}`);
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      return {
        success: true,
        data: responseData,
        statusCode: response.status
      };

    } catch (error) {
      console.error('Keystone API Error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      };
    }
  }

  // Health check for the proxy service
  async healthCheck(): Promise<KeystoneResponse> {
    try {
      const url = `${this.config.proxyUrl}/health`;
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        success: response.ok,
        data,
        statusCode: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  // Proxy service status
  async getProxyStatus(): Promise<KeystoneResponse> {
    return this.makeRequest('proxy-status');
  }

  // Example Keystone API methods (to be implemented based on actual API)
  async searchParts(query: string): Promise<KeystoneResponse> {
    return this.makeRequest(`SearchParts?query=${encodeURIComponent(query)}`);
  }

  async getPartDetails(partNumber: string): Promise<KeystoneResponse> {
    return this.makeRequest(`GetPartDetails?partNumber=${encodeURIComponent(partNumber)}`);
  }

  async checkInventory(partNumber: string): Promise<KeystoneResponse> {
    return this.makeRequest(`CheckInventory?partNumber=${encodeURIComponent(partNumber)}`);
  }

  async getPricing(partNumber: string): Promise<KeystoneResponse> {
    return this.makeRequest(`GetPricing?partNumber=${encodeURIComponent(partNumber)}`);
  }

  // Configuration getters
  getConfig(): KeystoneConfig {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!(this.config.proxyUrl && this.config.apiToken);
  }

  getEnvironment(): string {
    return this.config.environment;
  }
}

// Export singleton instance
export const keystoneService = new KeystoneService();
export default keystoneService;

