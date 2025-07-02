import { getSupabaseClient } from '@/lib/supabase';

// Kit component interface
export interface KitComponent {
  component_vcpn: string;
  quantity: number;
  description: string;
  list_price?: number;
  core_charge?: number;
}

// Kit components response interface
export interface KitComponentsResponse {
  success: boolean;
  components: KitComponent[];
  error?: string;
  kit_vcpn?: string;
}

// Database kit component interface
export interface DatabaseKitComponent {
  id: string;
  kit_vcpn: string;
  component_vcpn: string;
  quantity: number;
  description: string;
  list_price?: number;
  core_charge?: number;
  created_at: string;
  updated_at: string;
}

class KitComponentService {
  private static instance: KitComponentService;
  private supabase = getSupabaseClient();

  public static getInstance(): KitComponentService {
    if (!KitComponentService.instance) {
      KitComponentService.instance = new KitComponentService();
    }
    return KitComponentService.instance;
  }

  /**
   * Get kit components from Keystone API via proxy
   */
  async getKitComponents(kitVcpn: string): Promise<KitComponentsResponse> {
    try {
      const proxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
      const securityToken = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_DEV || 
                           import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;
      const accountNumber = import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER;

      if (!proxyUrl || !securityToken || !accountNumber) {
        throw new Error('Missing Keystone configuration environment variables');
      }

      const requestBody = {
        method: 'GetKitComponents',
        params: {
          vcpn: kitVcpn,
          securityToken: securityToken,
          accountNumber: accountNumber
        }
      };

      console.log('Fetching kit components for VCPN:', kitVcpn);

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('Keystone API error:', data.error);
        return {
          success: false,
          components: [],
          error: data.error,
          kit_vcpn: kitVcpn
        };
      }

      // Transform the response to match our interface
      const components: KitComponent[] = (data.components || []).map((comp: any) => ({
        component_vcpn: comp.vcpn || comp.componentVcpn || '',
        quantity: parseInt(comp.quantity) || 1,
        description: comp.description || comp.partDescription || '',
        list_price: parseFloat(comp.listPrice) || undefined,
        core_charge: parseFloat(comp.coreCharge) || undefined
      }));

      console.log(`Found ${components.length} components for kit ${kitVcpn}`);

      return {
        success: true,
        components,
        kit_vcpn: kitVcpn
      };

    } catch (error) {
      console.error('Error fetching kit components:', error);
      return {
        success: false,
        components: [],
        error: error.message || 'Failed to fetch kit components',
        kit_vcpn: kitVcpn
      };
    }
  }

  /**
   * Store kit components in database
   */
  async storeKitComponents(kitVcpn: string, components: KitComponent[]): Promise<boolean> {
    try {
      // First, delete existing components for this kit
      await this.supabase
        .from('keystone_kit_components')
        .delete()
        .eq('kit_vcpn', kitVcpn);

      // Insert new components
      if (components.length > 0) {
        const dbComponents = components.map(comp => ({
          kit_vcpn: kitVcpn,
          component_vcpn: comp.component_vcpn,
          quantity: comp.quantity,
          description: comp.description,
          list_price: comp.list_price,
          core_charge: comp.core_charge
        }));

        const { error } = await this.supabase
          .from('keystone_kit_components')
          .insert(dbComponents);

        if (error) {
          console.error('Error storing kit components:', error);
          return false;
        }
      }

      console.log(`Stored ${components.length} components for kit ${kitVcpn}`);
      return true;

    } catch (error) {
      console.error('Error storing kit components:', error);
      return false;
    }
  }

  /**
   * Get kit components from database
   */
  async getStoredKitComponents(kitVcpn: string): Promise<KitComponent[]> {
    try {
      const { data, error } = await this.supabase
        .from('keystone_kit_components')
        .select('*')
        .eq('kit_vcpn', kitVcpn)
        .order('component_vcpn');

      if (error) {
        console.error('Error fetching stored kit components:', error);
        return [];
      }

      return (data || []).map(comp => ({
        component_vcpn: comp.component_vcpn,
        quantity: comp.quantity,
        description: comp.description,
        list_price: comp.list_price,
        core_charge: comp.core_charge
      }));

    } catch (error) {
      console.error('Error fetching stored kit components:', error);
      return [];
    }
  }

  /**
   * Check if a VCPN is a kit by attempting to fetch components
   */
  async isKit(vcpn: string): Promise<boolean> {
    try {
      // First check if we have stored components
      const storedComponents = await this.getStoredKitComponents(vcpn);
      if (storedComponents.length > 0) {
        return true;
      }

      // If not stored, try fetching from API
      const response = await this.getKitComponents(vcpn);
      if (response.success && response.components.length > 0) {
        // Store the components for future use
        await this.storeKitComponents(vcpn, response.components);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Error checking if VCPN is kit:', error);
      return false;
    }
  }

  /**
   * Get kit components with caching (try database first, then API)
   */
  async getKitComponentsWithCache(kitVcpn: string, forceRefresh = false): Promise<KitComponentsResponse> {
    try {
      // If not forcing refresh, try database first
      if (!forceRefresh) {
        const storedComponents = await this.getStoredKitComponents(kitVcpn);
        if (storedComponents.length > 0) {
          return {
            success: true,
            components: storedComponents,
            kit_vcpn: kitVcpn
          };
        }
      }

      // Fetch from API
      const apiResponse = await this.getKitComponents(kitVcpn);
      
      // Store in database if successful
      if (apiResponse.success && apiResponse.components.length > 0) {
        await this.storeKitComponents(kitVcpn, apiResponse.components);
      }

      return apiResponse;

    } catch (error) {
      console.error('Error getting kit components with cache:', error);
      return {
        success: false,
        components: [],
        error: error.message || 'Failed to get kit components',
        kit_vcpn: kitVcpn
      };
    }
  }

  /**
   * Sync kit components for multiple VCPNs
   */
  async syncKitComponents(vcpns: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const vcpn of vcpns) {
      try {
        const response = await this.getKitComponents(vcpn);
        if (response.success && response.components.length > 0) {
          const stored = await this.storeKitComponents(vcpn, response.components);
          if (stored) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Failed to store components for ${vcpn}`);
          }
        } else if (response.error) {
          results.failed++;
          results.errors.push(`${vcpn}: ${response.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${vcpn}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Get all kits from database
   */
  async getAllKits(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('keystone_kit_components')
        .select('kit_vcpn')
        .order('kit_vcpn');

      if (error) {
        console.error('Error fetching all kits:', error);
        return [];
      }

      // Get unique kit VCPNs
      const uniqueKits = [...new Set((data || []).map(item => item.kit_vcpn))];
      return uniqueKits;

    } catch (error) {
      console.error('Error fetching all kits:', error);
      return [];
    }
  }

  /**
   * Delete kit components from database
   */
  async deleteKitComponents(kitVcpn: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('keystone_kit_components')
        .delete()
        .eq('kit_vcpn', kitVcpn);

      if (error) {
        console.error('Error deleting kit components:', error);
        return false;
      }

      console.log(`Deleted components for kit ${kitVcpn}`);
      return true;

    } catch (error) {
      console.error('Error deleting kit components:', error);
      return false;
    }
  }
}

// Export singleton instance
export const kitComponentService = KitComponentService.getInstance();
export default kitComponentService;

