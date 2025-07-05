import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, MapPin, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Types
interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  brand?: string;
  category?: string;
  isKit?: boolean;
  kitComponents?: CartItem[];
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderData {
  customer: CustomerInfo;
  shipping: ShippingAddress;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  expandKits: boolean;
}

// Order Service for eKeystone Integration
class OrderService {
  private static baseUrl = import.meta.env.VITE_KEYSTONE_PROXY_URL;
  private static apiToken = import.meta.env.VITE_KEYSTONE_API_TOKEN;
  private static securityToken = import.meta.env.VITE_KEYSTONE_SECURITY_TOKEN;
  private static accountNumber = import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER;

  static async submitOrder(orderData: OrderData): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      // Validate environment variables
      if (!this.baseUrl || !this.apiToken || !this.accountNumber) {
        throw new Error('Missing required environment variables for eKeystone integration');
      }

      // Prepare order items for eKeystone
      const orderItems = this.prepareOrderItems(orderData.items, orderData.expandKits);

      // Create eKeystone order payload
      const keystonePayload = {
        MessageType: 'ElectronicOrder',
        AccountNumber: this.accountNumber,
        SecurityToken: this.securityToken,
        OrderData: {
          CustomerInfo: {
            FirstName: orderData.customer.firstName,
            LastName: orderData.customer.lastName,
            Email: orderData.customer.email,
            Phone: orderData.customer.phone,
            Company: orderData.customer.company || ''
          },
          ShippingAddress: {
            Street: orderData.shipping.street,
            City: orderData.shipping.city,
            State: orderData.shipping.state,
            ZipCode: orderData.shipping.zipCode,
            Country: orderData.shipping.country
          },
          OrderItems: orderItems,
          OrderTotals: {
            Subtotal: orderData.subtotal,
            Tax: orderData.tax,
            Shipping: orderData.shipping,
            Total: orderData.total
          },
          ExpandKits: orderData.expandKits,
          OrderDate: new Date().toISOString(),
          RequestedDeliveryDate: this.calculateDeliveryDate()
        }
      };

      // Submit to eKeystone via Digital Ocean proxy
      const response = await fetch(`${this.baseUrl}/api/orders/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
          'X-Security-Token': this.securityToken
        },
        body: JSON.stringify(keystonePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        orderId: result.orderId || result.OrderId || result.order_id
      };

    } catch (error) {
      console.error('Order submission failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private static prepareOrderItems(items: CartItem[], expandKits: boolean): any[] {
    const orderItems: any[] = [];

    items.forEach(item => {
      if (item.isKit && expandKits && item.kitComponents) {
        // Add kit components individually
        item.kitComponents.forEach(component => {
          orderItems.push({
            SKU: component.sku,
            PartName: component.name,
            Quantity: component.quantity * item.quantity,
            UnitPrice: component.price,
            UnitCost: component.cost,
            Brand: component.brand || '',
            Category: component.category || '',
            IsKitComponent: true,
            ParentKitSKU: item.sku
          });
        });
      } else {
        // Add item as-is
        orderItems.push({
          SKU: item.sku,
          PartName: item.name,
          Quantity: item.quantity,
          UnitPrice: item.price,
          UnitCost: item.cost,
          Brand: item.brand || '',
          Category: item.category || '',
          IsKit: item.isKit || false
        });
      }
    });

    return orderItems;
  }

  private static calculateDeliveryDate(): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 days from now
    return deliveryDate.toISOString();
  }
}

// Main Checkout Process Component
export const CheckoutProcess: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: ''
  });
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [expandKits, setExpandKits] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ success: boolean; orderId?: string; error?: string } | null>(null);

  // Load cart items from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart.items || []);
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shippingCost = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const total = subtotal + tax + shippingCost;

  // Validation functions
  const validateCustomerInfo = (): boolean => {
    return !!(customerInfo.firstName && customerInfo.lastName && customerInfo.email && customerInfo.phone);
  };

  const validateShippingAddress = (): boolean => {
    return !!(shippingAddress.street && shippingAddress.city && shippingAddress.state && shippingAddress.zipCode);
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!validateCustomerInfo() || !validateShippingAddress()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    const orderData: OrderData = {
      customer: customerInfo,
      shipping: shippingAddress,
      items: cartItems,
      subtotal,
      tax,
      shipping: shippingCost,
      total,
      expandKits
    };

    const result = await OrderService.submitOrder(orderData);
    setOrderResult(result);
    setIsSubmitting(false);

    if (result.success) {
      // Clear cart on successful order
      localStorage.removeItem('cart');
      setCurrentStep(4); // Move to confirmation step
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep === 1 && !validateCustomerInfo()) {
      alert('Please fill in all customer information');
      return;
    }
    if (currentStep === 2 && !validateShippingAddress()) {
      alert('Please fill in all shipping information');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Render step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  // Step 1: Customer Information
  const CustomerInfoStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Customer Information</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={customerInfo.firstName}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={customerInfo.lastName}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company (Optional)
          </label>
          <input
            type="text"
            value={customerInfo.company}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Shipping Address
  const ShippingAddressStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Shipping Address</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <input
            type="text"
            value={shippingAddress.street}
            onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <select
              value={shippingAddress.state}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select State</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="HI">Hawaii</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
              <option value="OH">Ohio</option>
              <option value="OK">Oklahoma</option>
              <option value="OR">Oregon</option>
              <option value="PA">Pennsylvania</option>
              <option value="RI">Rhode Island</option>
              <option value="SC">South Carolina</option>
              <option value="SD">South Dakota</option>
              <option value="TN">Tennessee</option>
              <option value="TX">Texas</option>
              <option value="UT">Utah</option>
              <option value="VT">Vermont</option>
              <option value="VA">Virginia</option>
              <option value="WA">Washington</option>
              <option value="WV">West Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="WY">Wyoming</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code *
            </label>
            <input
              type="text"
              value={shippingAddress.zipCode}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <select
            value={shippingAddress.country}
            onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="MX">Mexico</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Step 3: Order Review
  const OrderReviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold">Order Review</h2>
      </div>
      
      {/* Kit Expansion Option */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={expandKits}
            onChange={(e) => setExpandKits(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Expand kits into individual components
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          When enabled, kit items will be broken down into their individual components for ordering
        </p>
      </div>

      {/* Order Items */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="font-medium text-gray-900">Order Items</h3>
        </div>
        <div className="divide-y">
          {cartItems.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  {item.brand && (
                    <p className="text-sm text-gray-500">Brand: {item.brand}</p>
                  )}
                  {item.isKit && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                      Kit Item
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">${item.price.toFixed(2)} × {item.quantity}</p>
                  <p className="text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
              
              {/* Show kit components if expanding kits */}
              {item.isKit && expandKits && item.kitComponents && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Kit Components:</p>
                  {item.kitComponents.map((component, index) => (
                    <div key={index} className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{component.name} (SKU: {component.sku})</span>
                      <span>{component.quantity} × ${component.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="font-medium text-gray-900">Order Summary</h3>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping:</span>
            <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Customer & Shipping Info Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{customerInfo.firstName} {customerInfo.lastName}</p>
            <p>{customerInfo.email}</p>
            <p>{customerInfo.phone}</p>
            {customerInfo.company && <p>{customerInfo.company}</p>}
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{shippingAddress.street}</p>
            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
            <p>{shippingAddress.country}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Order Confirmation
  const OrderConfirmationStep = () => (
    <div className="text-center space-y-6">
      {orderResult?.success ? (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-semibold text-green-600">Order Submitted Successfully!</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              Your order has been submitted to our system and will be processed shortly.
            </p>
            {orderResult.orderId && (
              <p className="text-green-700 font-medium mt-2">
                Order ID: {orderResult.orderId}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">
              You will receive an email confirmation shortly with tracking information.
            </p>
            <button
              onClick={() => window.location.href = '/orders'}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Track Your Order
            </button>
          </div>
        </>
      ) : (
        <>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-semibold text-red-600">Order Submission Failed</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              {orderResult?.error || 'An unknown error occurred while submitting your order.'}
            </p>
          </div>
          <button
            onClick={() => setCurrentStep(3)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );

  // Main render
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>
        
        <StepIndicator />
        
        <div className="min-h-96">
          {currentStep === 1 && <CustomerInfoStep />}
          {currentStep === 2 && <ShippingAddressStep />}
          {currentStep === 3 && <OrderReviewStep />}
          {currentStep === 4 && <OrderConfirmationStep />}
        </div>
        
        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-md transition-colors ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Previous
            </button>
            
            {currentStep === 3 ? (
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-8 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Order'}</span>
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutProcess;

