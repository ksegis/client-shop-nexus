// =====================================================
// PHASE 1 - WEEK 4: COMPLETE KEYSTONE API METHODS
// Full implementation of all Keystone API methods
// =====================================================

import { KeystoneService } from './KeystoneService';
import { supabase } from '@/lib/supabase';

/**
 * Extended Keystone service with all API methods implemented
 */
export class KeystoneAPIService extends KeystoneService {

  // =====================================================
  // INVENTORY MANAGEMENT METHODS
  // =====================================================

  /**
   * Get full inventory for all parts
   */
  async getFullInventory(): Promise<any[]> {
    const syncLogId = await this.startSyncLog('inventory_full', 'manual');
    
    try {
      const response = await this.makeSOAPCall('GetFullInventory');
      
      await this.logAPICall(syncLogId, 'GetFullInventory', {}, response);
      
      if (response.success) {
        const tables = this.parseCSVTable(response.data);
        const inventoryData = tables.find(t => t.name.includes('Inventory') || t.rows.length > 0)?.rows || [];
        
        // Store in database
        await this.syncInventoryData(inventoryData);
        
        await this.completeSyncLog(syncLogId, 'completed', {
          recordsProcessed: inventoryData.length,
          recordsUpdated: inventoryData.length
        });
        
        return inventoryData;
      } else {
        await this.completeSyncLog(syncLogId, 'failed', {
          error: response.error || response.statusMessage
        });
        throw new Error(response.error || response.statusMessage || 'Failed to get inventory');
      }
    } catch (error) {
      await this.completeSyncLog(syncLogId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get inventory updates since last sync
   */
  async getInventoryUpdates(lastSyncDate?: Date): Promise<any[]> {
    const syncLogId = await this.startSyncLog('inventory_updates', 'scheduled');
    
    try {
      const params: any = {};
      if (lastSyncDate) {
        params.LastUpdateDate = lastSyncDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      }

      const response = await this.makeSOAPCall('GetInventoryUpdates', params);
      
      await this.logAPICall(syncLogId, 'GetInventoryUpdates', params, response);
      
      if (response.success) {
        const tables = this.parseCSVTable(response.data);
        const inventoryData = tables.find(t => t.name.includes('Inventory') || t.rows.length > 0)?.rows || [];
        
        // Update database
        await this.syncInventoryData(inventoryData);
        
        await this.completeSyncLog(syncLogId, 'completed', {
          recordsProcessed: inventoryData.length,
          recordsUpdated: inventoryData.length
        });
        
        return inventoryData;
      } else {
        await this.completeSyncLog(syncLogId, 'failed', {
          error: response.error || response.statusMessage
        });
        throw new Error(response.error || response.statusMessage || 'Failed to get inventory updates');
      }
    } catch (error) {
      await this.completeSyncLog(syncLogId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check inventory for specific parts
   */
  async checkInventoryBulk(partNumbers: string[]): Promise<any[]> {
    const response = await this.makeSOAPCall('CheckInventoryBulk', {
      FullPartNo: partNumbers.join(',')
    });
    
    if (response.success) {
      const tables = this.parseCSVTable(response.data);
      return tables.find(t => t.rows.length > 0)?.rows || [];
    }
    
    throw new Error(response.error || 'Failed to check inventory');
  }

  // =====================================================
  // PARTS CATALOG METHODS
  // =====================================================

  /**
   * Get full parts catalog
   */
  async getFullCatalog(): Promise<any[]> {
    const syncLogId = await this.startSyncLog('catalog_full', 'manual');
    
    try {
      const response = await this.makeSOAPCall('GetFullCatalog');
      
      await this.logAPICall(syncLogId, 'GetFullCatalog', {}, response);
      
      if (response.success) {
        const tables = this.parseCSVTable(response.data);
        const catalogData = tables.find(t => t.name.includes('Catalog') || t.rows.length > 0)?.rows || [];
        
        // Store in database
        await this.syncCatalogData(catalogData);
        
        await this.completeSyncLog(syncLogId, 'completed', {
          recordsProcessed: catalogData.length,
          recordsCreated: catalogData.length
        });
        
        return catalogData;
      } else {
        await this.completeSyncLog(syncLogId, 'failed', {
          error: response.error || response.statusMessage
        });
        throw new Error(response.error || response.statusMessage || 'Failed to get catalog');
      }
    } catch (error) {
      await this.completeSyncLog(syncLogId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Search parts by various criteria
   */
  async searchParts(criteria: {
    partNumber?: string;
    description?: string;
    manufacturer?: string;
    category?: string;
  }): Promise<any[]> {
    const params: any = {};
    
    if (criteria.partNumber) params.PartNumber = criteria.partNumber;
    if (criteria.description) params.Description = criteria.description;
    if (criteria.manufacturer) params.Manufacturer = criteria.manufacturer;
    if (criteria.category) params.Category = criteria.category;

    const response = await this.makeSOAPCall('SearchParts', params);
    
    if (response.success) {
      const tables = this.parseCSVTable(response.data);
      return tables.find(t => t.rows.length > 0)?.rows || [];
    }
    
    throw new Error(response.error || 'Failed to search parts');
  }

  // =====================================================
  // PRICING METHODS
  // =====================================================

  /**
   * Get customer pricing for specific parts
   */
  async getCustomerPricing(customerAccount: string, partNumbers: string[]): Promise<any[]> {
    const response = await this.makeSOAPCall('GetCustomerPricing', {
      CustomerAccount: customerAccount,
      PartNumbers: partNumbers.join(',')
    });
    
    if (response.success) {
      const tables = this.parseCSVTable(response.data);
      const pricingData = tables.find(t => t.rows.length > 0)?.rows || [];
      
      // Store pricing in database
      await this.syncPricingData(customerAccount, pricingData);
      
      return pricingData;
    }
    
    throw new Error(response.error || 'Failed to get customer pricing');
  }

  /**
   * Get general pricing for parts
   */
  async getGeneralPricing(partNumbers: string[]): Promise<any[]> {
    const response = await this.makeSOAPCall('GetGeneralPricing', {
      PartNumbers: partNumbers.join(',')
    });
    
    if (response.success) {
      const tables = this.parseCSVTable(response.data);
      return tables.find(t => t.rows.length > 0)?.rows || [];
    }
    
    throw new Error(response.error || 'Failed to get general pricing');
  }

  // =====================================================
  // ORDER MANAGEMENT METHODS
  // =====================================================

  /**
   * Submit a jobber order (parts shipped to shop)
   */
  async submitJobberOrder(orderData: {
    customerPO: string;
    items: Array<{
      partNumber: string;
      quantity: number;
      unitPrice?: number;
    }>;
    shippingAddress: {
      name: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zipCode: string;
      phone?: string;
    };
  }): Promise<string> {
    const syncLogId = await this.startSyncLog('order_submit', 'manual');
    
    try {
      // Format items for Keystone
      const itemsXML = orderData.items.map(item => 
        `<Item><PartNumber>${item.partNumber}</PartNumber><Quantity>${item.quantity}</Quantity></Item>`
      ).join('');

      const params = {
        CustomerPO: orderData.customerPO,
        Items: itemsXML,
        ShipToName: orderData.shippingAddress.name,
        ShipToAddress1: orderData.shippingAddress.address1,
        ShipToAddress2: orderData.shippingAddress.address2 || '',
        ShipToCity: orderData.shippingAddress.city,
        ShipToState: orderData.shippingAddress.state,
        ShipToZip: orderData.shippingAddress.zipCode,
        ShipToPhone: orderData.shippingAddress.phone || ''
      };

      const response = await this.makeSOAPCall('SubmitJobberOrder', params);
      
      await this.logAPICall(syncLogId, 'SubmitJobberOrder', params, response);
      
      if (response.success) {
        const orderNumber = response.data.OrderNumber || response.data;
        
        // Store order in database
        await this.storeOrder(orderNumber, 'jobber', orderData);
        
        await this.completeSyncLog(syncLogId, 'completed', {
          recordsProcessed: 1,
          recordsCreated: 1,
          orderNumber
        });
        
        return orderNumber;
      } else {
        await this.completeSyncLog(syncLogId, 'failed', {
          error: response.error || response.statusMessage
        });
        throw new Error(response.error || response.statusMessage || 'Failed to submit order');
      }
    } catch (error) {
      await this.completeSyncLog(syncLogId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Submit a dropship order (parts shipped directly to customer)
   */
  async submitDropshipOrder(orderData: {
    customerPO: string;
    items: Array<{
      partNumber: string;
      quantity: number;
      unitPrice?: number;
    }>;
    shippingAddress: {
      name: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zipCode: string;
      phone?: string;
    };
  }): Promise<string> {
    const syncLogId = await this.startSyncLog('dropship_submit', 'manual');
    
    try {
      // Format items for Keystone
      const itemsXML = orderData.items.map(item => 
        `<Item><PartNumber>${item.partNumber}</PartNumber><Quantity>${item.quantity}</Quantity></Item>`
      ).join('');

      const params = {
        CustomerPO: orderData.customerPO,
        Items: itemsXML,
        ShipToName: orderData.shippingAddress.name,
        ShipToAddress1: orderData.shippingAddress.address1,
        ShipToAddress2: orderData.shippingAddress.address2 || '',
        ShipToCity: orderData.shippingAddress.city,
        ShipToState: orderData.shippingAddress.state,
        ShipToZip: orderData.shippingAddress.zipCode,
        ShipToPhone: orderData.shippingAddress.phone || ''
      };

      const response = await this.makeSOAPCall('SubmitDropshipOrder', params);
      
      await this.logAPICall(syncLogId, 'SubmitDropshipOrder', params, response);
      
      if (response.success) {
        const orderNumber = response.data.OrderNumber || response.data;
        
        // Store order in database
        await this.storeOrder(orderNumber, 'dropship', orderData);
        
        await this.completeSyncLog(syncLogId, 'completed', {
          recordsProcessed: 1,
          recordsCreated: 1,
          orderNumber
        });
        
        return orderNumber;
      } else {
        await this.completeSyncLog(syncLogId, 'failed', {
          error: response.error || response.statusMessage
        });
        throw new Error(response.error || response.statusMessage || 'Failed to submit dropship order');
      }
    } catch (error) {
      await this.completeSyncLog(syncLogId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get order status and tracking information
   */
  async getOrderStatus(orderNumber: string): Promise<any> {
    const response = await this.makeSOAPCall('GetOrderStatus', {
      OrderNumber: orderNumber
    });
    
    if (response.success) {
      const tables = this.parseCSVTable(response.data);
      const orderData = tables.find(t => t.rows.length > 0)?.rows[0];
      
      // Update order status in database
      if (orderData) {
        await this.updateOrderStatus(orderNumber, orderData);
      }
      
      return orderData;
    }
    
    throw new Error(response.error || 'Failed to get order status');
  }

  // =====================================================
  // DATABASE SYNCHRONIZATION METHODS
  // =====================================================

  /**
   * Sync inventory data to database
   */
  private async syncInventoryData(inventoryData: any[]): Promise<void> {
    try {
      for (const item of inventoryData) {
        const { error } = await supabase
          .from('keystone_inventory')
          .upsert({
            vcpn: item.VCPN || item.PartNumber,
            warehouse_code: item.WarehouseCode || item.Warehouse,
            quantity: parseInt(item.Quantity) || 0,
            available_quantity: parseInt(item.AvailableQuantity || item.Available) || 0,
            allocated_quantity: parseInt(item.AllocatedQuantity || item.Allocated) || 0,
            last_updated: new Date().toISOString(),
            sync_status: 'synced'
          }, {
            onConflict: 'vcpn,warehouse_code'
          });

        if (error) {
          console.error('Failed to sync inventory item:', error);
        }
      }
    } catch (error) {
      console.error('Failed to sync inventory data:', error);
    }
  }

  /**
   * Sync catalog data to database
   */
  private async syncCatalogData(catalogData: any[]): Promise<void> {
    try {
      for (const item of catalogData) {
        const { error } = await supabase
          .from('keystone_parts')
          .upsert({
            vcpn: item.VCPN || item.PartNumber,
            description: item.Description,
            manufacturer: item.Manufacturer || item.Brand,
            category: item.Category,
            subcategory: item.Subcategory,
            list_price: parseFloat(item.ListPrice) || 0,
            weight: parseFloat(item.Weight) || 0,
            dimensions: item.Dimensions,
            features: item.Features ? item.Features.split(',') : [],
            compatibility: item.Compatibility ? item.Compatibility.split(',') : [],
            superseded_by: item.SupersededBy,
            supersedes: item.Supersedes ? item.Supersedes.split(',') : [],
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'vcpn'
          });

        if (error) {
          console.error('Failed to sync catalog item:', error);
        }
      }
    } catch (error) {
      console.error('Failed to sync catalog data:', error);
    }
  }

  /**
   * Sync pricing data to database
   */
  private async syncPricingData(customerAccount: string, pricingData: any[]): Promise<void> {
    try {
      // Get customer ID from account number
      const { data: customer } = await supabase
        .from('profiles')
        .select('id')
        .eq('customer_account', customerAccount)
        .single();

      for (const item of pricingData) {
        const { error } = await supabase
          .from('keystone_pricing')
          .upsert({
            customer_id: customer?.id,
            vcpn: item.VCPN || item.PartNumber,
            customer_price: parseFloat(item.CustomerPrice) || 0,
            list_price: parseFloat(item.ListPrice) || 0,
            core_charge: parseFloat(item.CoreCharge) || 0,
            price_tier: item.PriceTier,
            quantity_breaks: item.QuantityBreaks ? JSON.parse(item.QuantityBreaks) : null,
            effective_date: item.EffectiveDate ? new Date(item.EffectiveDate) : null,
            expiration_date: item.ExpirationDate ? new Date(item.ExpirationDate) : null,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'customer_id,vcpn'
          });

        if (error) {
          console.error('Failed to sync pricing item:', error);
        }
      }
    } catch (error) {
      console.error('Failed to sync pricing data:', error);
    }
  }

  /**
   * Store order in database
   */
  private async storeOrder(orderNumber: string, orderType: 'jobber' | 'dropship', orderData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('keystone_orders')
        .insert({
          order_number: orderNumber,
          order_type: orderType,
          status: 'submitted',
          ship_to_address: orderData.shippingAddress,
          customer_po: orderData.customerPO,
          submitted_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store order:', error);
      }
    } catch (error) {
      console.error('Failed to store order:', error);
    }
  }

  /**
   * Update order status in database
   */
  private async updateOrderStatus(orderNumber: string, statusData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('keystone_orders')
        .update({
          status: statusData.Status?.toLowerCase(),
          tracking_number: statusData.TrackingNumber,
          shipped_at: statusData.ShippedDate ? new Date(statusData.ShippedDate) : null,
          delivered_at: statusData.DeliveredDate ? new Date(statusData.DeliveredDate) : null,
          updated_at: new Date().toISOString()
        })
        .eq('order_number', orderNumber);

      if (error) {
        console.error('Failed to update order status:', error);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  }

  // =====================================================
  // AUTOMATED SYNC METHODS
  // =====================================================

  /**
   * Run automated inventory sync
   */
  async runInventorySync(): Promise<void> {
    try {
      // Get last sync date
      const { data: lastSync } = await supabase
        .from('keystone_sync_logs')
        .select('completed_at')
        .eq('sync_type', 'inventory_updates')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      const lastSyncDate = lastSync?.completed_at ? new Date(lastSync.completed_at) : undefined;

      // Get inventory updates
      await this.getInventoryUpdates(lastSyncDate);
      
      console.log('Automated inventory sync completed');
    } catch (error) {
      console.error('Automated inventory sync failed:', error);
    }
  }

  /**
   * Run automated pricing sync for all customers
   */
  async runPricingSync(): Promise<void> {
    try {
      // Get all customers with account numbers
      const { data: customers } = await supabase
        .from('profiles')
        .select('id, customer_account')
        .not('customer_account', 'is', null);

      if (!customers) return;

      for (const customer of customers) {
        try {
          // Get customer's parts for pricing update
          const { data: customerParts } = await supabase
            .from('keystone_pricing')
            .select('vcpn')
            .eq('customer_id', customer.id);

          if (customerParts && customerParts.length > 0) {
            const partNumbers = customerParts.map(p => p.vcpn);
            await this.getCustomerPricing(customer.customer_account, partNumbers);
          }
        } catch (error) {
          console.error(`Failed to sync pricing for customer ${customer.customer_account}:`, error);
        }
      }
      
      console.log('Automated pricing sync completed');
    } catch (error) {
      console.error('Automated pricing sync failed:', error);
    }
  }
}

// Export singleton instance
export const keystoneAPI = new KeystoneAPIService();

