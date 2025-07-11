import React, { useState, useEffect } from 'react';
import { Search, Package, Truck, CheckCircle, AlertCircle, Clock, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

// Types
interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  isKitComponent?: boolean;
  parentKitSKU?: string;
}

interface OrderDetails {
  orderId: string;
  confirmationNumber: string;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    method: string;
  };
  items: OrderItem[];
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  tracking?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    estimatedDelivery: string;
    currentLocation?: string;
  };
  statusHistory: {
    status: string;
    date: string;
    description: string;
    location?: string;
  }[];
}

// Order Tracking Service
class OrderTrackingService {
  private static baseUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
  private static apiToken = import.meta.env.VITE_KEYSTONE_API_TOKEN;
  private static securityToken = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN;

  static async searchOrder(searchTerm: string, searchType: 'orderId' | 'confirmation' | 'email'): Promise<{ success: boolean; orders?: OrderDetails[]; error?: string }> {
    try {
      if (!this.baseUrl || !this.apiToken) {
        throw new Error('Missing required environment variables for order tracking');
      }

      const response = await fetch(`${this.baseUrl}/api/orders/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
          'X-Security-Token': this.securityToken
        },
        body: JSON.stringify({
          searchTerm,
          searchType,
          includeHistory: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        orders: result.orders || []
      };

    } catch (error) {
      console.error('Order search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getOrderDetails(orderId: string): Promise<{ success: boolean; order?: OrderDetails; error?: string }> {
    try {
      if (!this.baseUrl || !this.apiToken) {
        throw new Error('Missing required environment variables for order tracking');
      }

      const response = await fetch(`${this.baseUrl}/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'X-Security-Token': this.securityToken
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        order: result.order
      };

    } catch (error) {
      console.error('Order details fetch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getCustomerOrders(email: string): Promise<{ success: boolean; orders?: OrderDetails[]; error?: string }> {
    try {
      if (!this.baseUrl || !this.apiToken) {
        throw new Error('Missing required environment variables for order tracking');
      }

      const response = await fetch(`${this.baseUrl}/api/orders/customer/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'X-Security-Token': this.securityToken
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        orders: result.orders || []
      };

    } catch (error) {
      console.error('Customer orders fetch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Order Search Component
const OrderSearch: React.FC<{ onOrderFound: (orders: OrderDetails[]) => void }> = ({ onOrderFound }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'orderId' | 'confirmation' | 'email'>('orderId');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);

    const result = await OrderTrackingService.searchOrder(searchTerm.trim(), searchType);
    
    if (result.success && result.orders) {
      onOrderFound(result.orders);
    } else {
      setError(result.error || 'No orders found');
    }
    
    setIsSearching(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <Search className="w-6 h-6 mr-2 text-blue-600" />
        Track Your Order
      </h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by:
          </label>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'orderId' | 'confirmation' | 'email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          >
            <option value="orderId">Order ID</option>
            <option value="confirmation">Confirmation Number</option>
            <option value="email">Email Address</option>
          </select>
        </div>
        
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              searchType === 'orderId' ? 'Enter Order ID (e.g., ORD-123456)' :
              searchType === 'confirmation' ? 'Enter Confirmation Number' :
              'Enter Email Address'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isSearching || !searchTerm.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Search Orders</span>
            </>
          )}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Order Status Badge Component
const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
      case 'processing':
        return { color: 'bg-blue-100 text-blue-800', icon: Package };
      case 'shipped':
        return { color: 'bg-purple-100 text-purple-800', icon: Truck };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', icon: AlertCircle };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Order Details Component
const OrderDetailsView: React.FC<{ order: OrderDetails }> = ({ order }) => {
  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const carriers = {
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
      'DHL': `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`
    };
    return carriers[carrier as keyof typeof carriers] || '#';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Order Header */}
      <div className="border-b pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Order #{order.orderId}</h2>
            <p className="text-gray-600">Confirmation: {order.confirmationNumber}</p>
            <p className="text-gray-600">Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Customer & Shipping Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-600" />
            Customer Information
          </h3>
          <div className="space-y-2 text-gray-600">
            <p className="font-medium">{order.customer.name}</p>
            <p className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              {order.customer.email}
            </p>
            <p className="flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              {order.customer.phone}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            Shipping Address
          </h3>
          <div className="space-y-1 text-gray-600">
            <p>{order.shipping.address}</p>
            <p>{order.shipping.city}, {order.shipping.state} {order.shipping.zipCode}</p>
            <p>{order.shipping.country}</p>
            <p className="text-sm text-gray-500 mt-2">Method: {order.shipping.method}</p>
          </div>
        </div>
      </div>

      {/* Tracking Information */}
      {order.tracking && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center text-blue-800">
            <Truck className="w-5 h-5 mr-2" />
            Tracking Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-600 font-medium">Carrier</p>
              <p className="text-blue-800">{order.tracking.carrier}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Tracking Number</p>
              <div className="flex items-center space-x-2">
                <p className="text-blue-800 font-mono">{order.tracking.trackingNumber}</p>
                <a
                  href={getTrackingUrl(order.tracking.carrier, order.tracking.trackingNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Estimated Delivery</p>
              <p className="text-blue-800">{new Date(order.tracking.estimatedDelivery).toLocaleDateString()}</p>
            </div>
            {order.tracking.currentLocation && (
              <div>
                <p className="text-sm text-blue-600 font-medium">Current Location</p>
                <p className="text-blue-800">{order.tracking.currentLocation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          Order Items
        </h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
          </div>
          <div className="divide-y">
            {order.items.map((item, index) => (
              <div key={index} className="px-4 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      {item.isKitComponent && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                          Kit Component
                        </span>
                      )}
                      <div className="mt-1">
                        <OrderStatusBadge status={item.status} />
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-gray-900">{item.quantity}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-gray-900">${item.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-medium text-gray-900">${item.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                {item.trackingNumber && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Tracking: </span>
                    <span className="font-mono">{item.trackingNumber}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Totals */}
      <div className="border rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">${order.totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax:</span>
            <span className="text-gray-900">${order.totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping:</span>
            <span className="text-gray-900">${order.totals.shipping.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>${order.totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Status History */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Order History</h3>
        <div className="space-y-3">
          {order.statusHistory.map((event, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{event.status}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    {event.location && (
                      <p className="text-sm text-gray-500">{event.location}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Order Tracking Component
export const OrderTracking: React.FC = () => {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [showSearch, setShowSearch] = useState(true);

  // Handle URL parameters for direct order lookup
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId') || window.location.pathname.split('/').pop();
    
    if (orderId && orderId !== 'orders') {
      handleDirectOrderLookup(orderId);
    }
  }, []);

  const handleDirectOrderLookup = async (orderId: string) => {
    const result = await OrderTrackingService.getOrderDetails(orderId);
    if (result.success && result.order) {
      setSelectedOrder(result.order);
      setShowSearch(false);
    }
  };

  const handleOrderFound = (foundOrders: OrderDetails[]) => {
    setOrders(foundOrders);
    if (foundOrders.length === 1) {
      setSelectedOrder(foundOrders[0]);
      setShowSearch(false);
    } else {
      setSelectedOrder(null);
      setShowSearch(false);
    }
  };

  const handleBackToSearch = () => {
    setShowSearch(true);
    setSelectedOrder(null);
    setOrders([]);
  };

  const handleSelectOrder = (order: OrderDetails) => {
    setSelectedOrder(order);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {showSearch && (
        <OrderSearch onOrderFound={handleOrderFound} />
      )}

      {!showSearch && !selectedOrder && orders.length > 1 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Multiple Orders Found</h2>
            <button
              onClick={handleBackToSearch}
              className="text-blue-600 hover:text-blue-800"
            >
              New Search
            </button>
          </div>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.orderId}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSelectOrder(order)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Order #{order.orderId}</h3>
                    <p className="text-gray-600">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                    <p className="text-gray-600">Total: ${order.totals.total.toFixed(2)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div>
          <div className="mb-4">
            <button
              onClick={handleBackToSearch}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back to Search</span>
            </button>
          </div>
          <OrderDetailsView order={selectedOrder} />
        </div>
      )}

      {!showSearch && !selectedOrder && orders.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h2>
          <p className="text-gray-500 mb-4">
            We couldn't find any orders matching your search criteria.
          </p>
          <button
            onClick={handleBackToSearch}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Another Search
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;

