// =====================================================
// PHASE 1 - WEEK 4: KEYSTONE SERVICE INDEX
// Main export file for all Keystone services
// =====================================================

// Core services
export { KeystoneSoapClient } from './KeystoneSoapClient';
export { KeystoneService, keystoneService } from './KeystoneService';
export { KeystoneAPIService, keystoneAPI } from './KeystoneAPIService';
export { KeystoneSyncScheduler, keystoneSyncScheduler } from './KeystoneSyncScheduler';

// React hooks
export {
  useKeystoneConfig,
  useKeystoneInventory,
  useKeystoneCatalog,
  useKeystoneOrders,
  useKeystoneSyncScheduler,
  useKeystoneMonitoring
} from '../hooks/keystone/useKeystone';

// Types and interfaces
export type {
  KeystoneConfig,
  KeystoneResponse,
  SOAPCallOptions
} from './KeystoneSoapClient';

export type {
  SyncSchedule
} from './KeystoneSyncScheduler';

// Utility functions
export const KeystoneUtils = {
  /**
   * Format part number for Keystone API
   */
  formatPartNumber: (partNumber: string): string => {
    return partNumber.trim().toUpperCase();
  },

  /**
   * Parse Keystone date format
   */
  parseKeystoneDate: (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  },

  /**
   * Format price for display
   */
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  },

  /**
   * Validate VCPN format
   */
  isValidVCPN: (vcpn: string): boolean => {
    // Keystone VCPNs are typically alphanumeric with specific patterns
    return /^[A-Z0-9\-]{6,20}$/.test(vcpn.toUpperCase());
  },

  /**
   * Get stock status from quantity
   */
  getStockStatus: (quantity: number, lowStockThreshold: number = 5): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= lowStockThreshold) return 'low_stock';
    return 'in_stock';
  },

  /**
   * Calculate estimated delivery date
   */
  calculateDeliveryDate: (shippingMethod: string, orderDate: Date = new Date()): Date => {
    const deliveryDays = {
      'standard': 5,
      'expedited': 3,
      'overnight': 1,
      'ground': 7
    };

    const days = deliveryDays[shippingMethod.toLowerCase() as keyof typeof deliveryDays] || 5;
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + days);
    
    return deliveryDate;
  }
};

// Configuration constants
export const KeystoneConstants = {
  API_ENDPOINTS: {
    PRODUCTION: 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx',
    DEVELOPMENT: 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx'
  },
  
  WSDL_URLS: {
    PRODUCTION: 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx?WSDL',
    DEVELOPMENT: 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx?WSDL'
  },

  ORDER_TYPES: {
    JOBBER: 'jobber',
    DROPSHIP: 'dropship'
  },

  ORDER_STATUSES: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    CONFIRMED: 'confirmed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
  },

  SYNC_TYPES: {
    INVENTORY_FULL: 'inventory_full',
    INVENTORY_UPDATES: 'inventory_updates',
    CATALOG_FULL: 'catalog_full',
    PRICING: 'pricing',
    CONNECTION_TEST: 'connection_test',
    ORDER_SUBMIT: 'order_submit',
    DROPSHIP_SUBMIT: 'dropship_submit'
  },

  DEFAULT_SYNC_INTERVALS: {
    INVENTORY: 30, // minutes
    PRICING: 240, // minutes (4 hours)
    CATALOG: 1440 // minutes (24 hours)
  }
};

// Error classes
export class KeystoneError extends Error {
  constructor(
    message: string,
    public statusCode?: string,
    public statusMessage?: string,
    public responseTime?: number
  ) {
    super(message);
    this.name = 'KeystoneError';
  }
}

export class KeystoneConfigError extends KeystoneError {
  constructor(message: string) {
    super(message);
    this.name = 'KeystoneConfigError';
  }
}

export class KeystoneAuthError extends KeystoneError {
  constructor(message: string) {
    super(message);
    this.name = 'KeystoneAuthError';
  }
}

export class KeystoneNetworkError extends KeystoneError {
  constructor(message: string, responseTime?: number) {
    super(message);
    this.name = 'KeystoneNetworkError';
    this.responseTime = responseTime;
  }
}

