import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

class OrderTrackingService {
  constructor() {
    this.rateLimitKey = 'order_tracking_rate_limit';
    this.statusKey = 'order_tracking_status';
    this.historyKey = 'order_tracking_history';
    this.rateLimitDuration = 3 * 60 * 1000; // 3 minutes between tracking requests
  }

  // Get current tracking service status
  getStatus() {
    try {
      const lastTrackingTime = localStorage.getItem(`${this.rateLimitKey}_timestamp`);
      const now = Date.now();
      
      let isRateLimited = false;
      let rateLimitMessage = '';
      let timeUntilNextTracking = 0;

      if (lastTrackingTime) {
        const timeSinceLastTracking = now - parseInt(lastTrackingTime);
        if (timeSinceLastTracking < this.rateLimitDuration) {
          isRateLimited = true;
          timeUntilNextTracking = this.rateLimitDuration - timeSinceLastTracking;
          rateLimitMessage = `Order tracking rate limited. Next tracking allowed in ${this.formatTimeRemaining(timeUntilNextTracking)}.`;
        }
      }

      const trackingHistory = this.getTrackingHistory();
      const lastTrackingRequest = trackingHistory.length > 0 ? trackingHistory[0] : null;

      return {
        isRateLimited,
        rateLimitMessage,
        timeUntilNextTracking,
        lastTrackingTime: lastTrackingRequest?.timestamp || null,
        trackingHistory: trackingHistory.slice(0, 5), // Last 5 tracking requests
        totalTrackedOrders: this.getTotalTrackedOrders()
      };
    } catch (error) {
      console.error('Error getting order tracking status:', error);
      return {
        isRateLimited: false,
        rateLimitMessage: '',
        timeUntilNextTracking: 0,
        lastTrackingTime: null,
        trackingHistory: [],
        totalTrackedOrders: 0
      };
    }
  }

  // Track multiple orders
  async trackOrders(orderReferences) {
    const environment = localStorage.getItem('admin_environment') || 'development';
    
    try {
      // Check rate limiting
      if (this.isRateLimited()) {
        const timeRemaining = this.getTimeUntilNextTracking();
        return {
          success: false,
          message: `Rate limited. Please wait ${this.formatTimeRemaining(timeRemaining)} before tracking orders again.`,
          isRateLimited: true
        };
      }

      // Validate input
      if (!orderReferences || orderReferences.length === 0) {
        return {
          success: false,
          message: 'No order references provided'
        };
      }

      if (orderReferences.length > 20) {
        return {
          success: false,
          message: 'Maximum 20 orders can be tracked per request'
        };
      }

      // Set rate limit
      this.setRateLimit();

      let trackingResults;

      if (environment === 'development') {
        // Mock tracking data for development
        trackingResults = this.generateMockTrackingData(orderReferences);
      } else {
        // Real API call for production
        trackingResults = await this.callKeystoneTrackingAPI(orderReferences);
      }

      // Log the tracking request
      await this.logTrackingRequest({
        orderReferences,
        results: trackingResults,
        environment,
        success: true
      });

      // Save to tracking history
      this.saveTrackingHistory({
        id: `track_${Date.now()}`,
        timestamp: new Date().toISOString(),
        orderReferences,
        results: trackingResults,
        success: true,
        environment
      });

      return {
        success: true,
        results: trackingResults,
        message: `Successfully tracked ${trackingResults.length} orders`
      };

    } catch (error) {
      console.error('Order tracking error:', error);

      // Log the failed tracking request
      await this.logTrackingRequest({
        orderReferences,
        error: error.message,
        environment,
        success: false
      });

      // Save failed tracking to history
      this.saveTrackingHistory({
        id: `track_${Date.now()}`,
        timestamp: new Date().toISOString(),
        orderReferences,
        error: error.message,
        success: false,
        environment
      });

      return {
        success: false,
        message: `Order tracking failed: ${error.message}`,
        error: error.message
      };
    }
  }

  // Track single order
  async trackOrder(orderReference) {
    return await this.trackOrders([orderReference]);
  }

  // Generate mock tracking data for development
  generateMockTrackingData(orderReferences) {
    const statuses = [
      'Order Received',
      'Processing',
      'Shipped',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Exception',
      'Returned'
    ];

    const carriers = ['UPS', 'FedEx', 'USPS', 'DHL'];
    const locations = [
      'Los Angeles, CA',
      'Chicago, IL',
      'New York, NY',
      'Atlanta, GA',
      'Dallas, TX',
      'Phoenix, AZ',
      'Philadelphia, PA',
      'Houston, TX'
    ];

    return orderReferences.map(orderRef => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Generate realistic tracking events
      const events = this.generateTrackingEvents(status, carrier, location);
      
      // Generate estimated delivery date
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 7) + 1);

      return {
        orderReference: orderRef,
        status,
        carrier,
        trackingNumber: this.generateMockTrackingNumber(carrier),
        currentLocation: location,
        estimatedDeliveryDate: deliveryDate.toISOString(),
        lastUpdated: new Date().toISOString(),
        events,
        deliveryInstructions: Math.random() > 0.5 ? 'Leave at front door' : null,
        signatureRequired: Math.random() > 0.7,
        insuranceValue: Math.random() > 0.6 ? (Math.random() * 500 + 100).toFixed(2) : null
      };
    });
  }

  // Generate realistic tracking events
  generateTrackingEvents(currentStatus, carrier, currentLocation) {
    const baseEvents = [
      {
        status: 'Order Received',
        location: 'Warehouse - Main Distribution Center',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Order received and being prepared for shipment'
      },
      {
        status: 'Processing',
        location: 'Warehouse - Main Distribution Center',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Order is being processed and packaged'
      },
      {
        status: 'Shipped',
        location: 'Origin Facility',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Package shipped via ${carrier}`
      }
    ];

    // Add current status event
    if (!baseEvents.find(e => e.status === currentStatus)) {
      baseEvents.push({
        status: currentStatus,
        location: currentLocation,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        description: this.getStatusDescription(currentStatus, currentLocation)
      });
    }

    return baseEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get status description
  getStatusDescription(status, location) {
    const descriptions = {
      'Order Received': 'Order received and being prepared for shipment',
      'Processing': 'Order is being processed and packaged',
      'Shipped': 'Package has been shipped',
      'In Transit': `Package is in transit at ${location}`,
      'Out for Delivery': `Package is out for delivery in ${location}`,
      'Delivered': `Package delivered to ${location}`,
      'Exception': `Delivery exception occurred at ${location}`,
      'Returned': `Package returned to sender from ${location}`
    };
    return descriptions[status] || `Package status: ${status}`;
  }

  // Generate mock tracking number
  generateMockTrackingNumber(carrier) {
    switch (carrier) {
      case 'UPS':
        return '1Z' + Math.random().toString(36).substr(2, 16).toUpperCase();
      case 'FedEx':
        return Math.random().toString().substr(2, 12);
      case 'USPS':
        return '9400' + Math.random().toString().substr(2, 16);
      case 'DHL':
        return Math.random().toString().substr(2, 10).toUpperCase();
      default:
        return Math.random().toString(36).substr(2, 12).toUpperCase();
    }
  }

  // Call real Keystone tracking API (placeholder for production)
  async callKeystoneTrackingAPI(orderReferences) {
    const keystoneProxyUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
    const securityToken = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN_PROD;

    if (!keystoneProxyUrl || !securityToken) {
      throw new Error('Keystone API configuration missing');
    }

    const response = await fetch(`${keystoneProxyUrl}/orders/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${securityToken}`
      },
      body: JSON.stringify({
        orderReferences
      })
    });

    if (!response.ok) {
      throw new Error(`Keystone API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.trackingResults || [];
  }

  // Rate limiting functions
  isRateLimited() {
    const lastTrackingTime = localStorage.getItem(`${this.rateLimitKey}_timestamp`);
    if (!lastTrackingTime) return false;
    
    const timeSinceLastTracking = Date.now() - parseInt(lastTrackingTime);
    return timeSinceLastTracking < this.rateLimitDuration;
  }

  setRateLimit() {
    localStorage.setItem(`${this.rateLimitKey}_timestamp`, Date.now().toString());
  }

  getTimeUntilNextTracking() {
    const lastTrackingTime = localStorage.getItem(`${this.rateLimitKey}_timestamp`);
    if (!lastTrackingTime) return 0;
    
    const timeSinceLastTracking = Date.now() - parseInt(lastTrackingTime);
    return Math.max(0, this.rateLimitDuration - timeSinceLastTracking);
  }

  clearRateLimit() {
    localStorage.removeItem(`${this.rateLimitKey}_timestamp`);
  }

  // Format time remaining
  formatTimeRemaining(milliseconds) {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Tracking history management
  getTrackingHistory() {
    try {
      const history = localStorage.getItem(this.historyKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting tracking history:', error);
      return [];
    }
  }

  saveTrackingHistory(trackingRequest) {
    try {
      const history = this.getTrackingHistory();
      history.unshift(trackingRequest);
      
      // Keep only last 50 tracking requests
      const trimmedHistory = history.slice(0, 50);
      localStorage.setItem(this.historyKey, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving tracking history:', error);
    }
  }

  getTotalTrackedOrders() {
    const history = this.getTrackingHistory();
    return history.reduce((total, request) => {
      return total + (request.orderReferences?.length || 0);
    }, 0);
  }

  // Database logging
  async logTrackingRequest(requestData) {
    try {
      const logEntry = {
        api_endpoint: 'order_tracking',
        request_data: {
          orderReferences: requestData.orderReferences,
          environment: requestData.environment
        },
        response_data: requestData.results || null,
        success: requestData.success,
        error_message: requestData.error || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('keystone_api_logs')
        .insert([logEntry]);

      if (error) {
        console.error('Error logging tracking request:', error);
      }
    } catch (error) {
      console.error('Error logging tracking request:', error);
    }
  }

  // Get order tracking statistics
  getTrackingStatistics() {
    const history = this.getTrackingHistory();
    const last24Hours = history.filter(request => {
      const requestTime = new Date(request.timestamp);
      const now = new Date();
      return (now - requestTime) < (24 * 60 * 60 * 1000);
    });

    const successfulRequests = history.filter(request => request.success);
    const failedRequests = history.filter(request => !request.success);

    return {
      totalRequests: history.length,
      requestsLast24Hours: last24Hours.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      successRate: history.length > 0 ? (successfulRequests.length / history.length * 100).toFixed(1) : 0,
      totalOrdersTracked: this.getTotalTrackedOrders()
    };
  }

  // Clear all tracking data (for testing)
  clearAllData() {
    localStorage.removeItem(`${this.rateLimitKey}_timestamp`);
    localStorage.removeItem(this.historyKey);
    localStorage.removeItem(this.statusKey);
  }
}

// Create and export singleton instance
export const orderTrackingService = new OrderTrackingService();

