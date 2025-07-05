import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_TOKEN
);

// Types based on your existing database schema
interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  active: boolean;
}

interface ShopAddress {
  id: string;
  name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  active: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  vcpn?: string;
}

interface CheckoutProcessProps {
  cart: CartItem[];
  totalPrice: number;
  onClearCart: () => void;
  onBackToShopping: () => void;
}

interface CustomerSearchResult {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  full_address: string;
}

export const CheckoutProcess: React.FC<CheckoutProcessProps> = ({
  cart,
  totalPrice,
  onClearCart,
  onBackToShopping
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Shipping state
  const [shippingType, setShippingType] = useState<'shop' | 'customer' | 'custom'>('shop');
  const [shopAddresses, setShopAddresses] = useState<ShopAddress[]>([]);
  const [selectedShopAddress, setSelectedShopAddress] = useState<string>('');
  const [customAddress, setCustomAddress] = useState({
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US'
  });
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('account');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Order confirmation state
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Load shop addresses on component mount
  useEffect(() => {
    loadShopAddresses();
  }, []);

  // Customer search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerSearch.trim().length >= 2) {
        searchCustomers(customerSearch);
      } else {
        setCustomerResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  // Load shop addresses from dedicated shop_addresses table
  const loadShopAddresses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('shop_addresses')
        .select('*')
        .eq('active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;

      setShopAddresses(data || []);
      
      // Set default shop address
      const defaultAddress = data?.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedShopAddress(defaultAddress.id);
      } else if (data && data.length > 0) {
        // If no default is set, use the first one
        setSelectedShopAddress(data[0].id);
      }
      
    } catch (err) {
      console.error('Error loading shop addresses:', err);
      setError('Failed to load shop addresses');
    } finally {
      setLoading(false);
    }
  };

  // Search customers in profiles table
  const searchCustomers = async (searchTerm: string) => {
    try {
      setSearchLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .eq('active', true)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      const results: CustomerSearchResult[] = data.map(profile => ({
        id: profile.id,
        display_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
                     'No Name',
        email: profile.email,
        phone: profile.phone,
        full_address: 'Address information not available in profiles'
      }));

      setCustomerResults(results);
      
    } catch (err) {
      console.error('Error searching customers:', err);
      setError('Failed to search customers');
    } finally {
      setSearchLoading(false);
    }
  };

  // Select customer
  const selectCustomer = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      setSelectedCustomer(data);
      setCustomerResults([]);
      setCustomerSearch('');
      
    } catch (err) {
      console.error('Error selecting customer:', err);
      setError('Failed to load customer details');
    }
  };

  // Submit order to your existing special_orders table
  const submitOrder = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare shipping address based on selection
      let shippingAddress;
      
      if (shippingType === 'shop') {
        const shopAddr = shopAddresses.find(addr => addr.id === selectedShopAddress);
        if (!shopAddr) throw new Error('Shop address not found');
        
        shippingAddress = {
          street_address: shopAddr.street_address,
          city: shopAddr.city,
          state: shopAddr.state,
          zip_code: shopAddr.zip_code,
          country: shopAddr.country
        };
      } else if (shippingType === 'customer') {
        // Note: Your profiles table doesn't have address fields
        // You may need to get this from customer_accounts table or require custom address
        shippingAddress = {
          street_address: 'Customer address not available',
          city: 'Please use custom address',
          state: '',
          zip_code: '',
          country: 'US'
        };
      } else {
        shippingAddress = customAddress;
      }

      // Create order in special_orders table
      const orderData = {
        customer_id: selectedCustomer.id,
        order_type: 'parts',
        status: 'pending',
        total_amount: totalPrice,
        shipping_type: shippingType,
        shipping_address: JSON.stringify(shippingAddress),
        payment_method: paymentMethod,
        notes: orderNotes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: order, error: orderError } = await supabase
        .from('special_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items in order_items table
      const orderItems = cart.map(item => ({
        order_id: order.id,
        part_number: item.sku || item.vcpn || item.id,
        description: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Generate order number
      const orderNum = `PO-${order.id.slice(-8).toUpperCase()}`;
      
      setOrderNumber(orderNum);
      setOrderSubmitted(true);
      setCurrentStep(5);
      
      // Clear cart after successful order
      onClearCart();
      
    } catch (err) {
      console.error('Error submitting order:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation functions
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return selectedCustomer !== null;
      case 2:
        if (shippingType === 'shop') {
          return selectedShopAddress !== '';
        } else if (shippingType === 'customer') {
          // Since profiles don't have addresses, suggest using custom address
          return false;
        } else {
          return customAddress.street_address !== '' && 
                 customAddress.city !== '' && 
                 customAddress.state !== '' && 
                 customAddress.zip_code !== '';
        }
      case 3:
        return paymentMethod !== '';
      default:
        return true;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Information</h2>
            
            {/* Customer Search */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for Customer
                </label>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchLoading && (
                  <p className="text-sm text-gray-500 mt-1">Searching...</p>
                )}
              </div>

              {/* Search Results */}
              {customerResults.length > 0 && (
                <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                  {customerResults.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => selectCustomer(customer.id)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.display_name}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      )}
                      {customer.phone && (
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Customer */}
              {selectedCustomer && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-green-900">Selected Customer</h3>
                      <p className="text-green-700">
                        {`${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim()}
                      </p>
                      {selectedCustomer.email && (
                        <p className="text-sm text-green-600">{selectedCustomer.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
            
            {/* Shipping Options */}
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Ship to Shop */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="shipping"
                    value="shop"
                    checked={shippingType === 'shop'}
                    onChange={(e) => setShippingType(e.target.value as 'shop')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Ship to Shop</div>
                    <div className="text-sm text-gray-600">
                      Parts will be delivered to the shop for customer pickup
                    </div>
                  </div>
                </label>

                {/* Shop Address Selection */}
                {shippingType === 'shop' && (
                  <div className="ml-6 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Shop Location
                    </label>
                    <select
                      value={selectedShopAddress}
                      onChange={(e) => setSelectedShopAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a shop location...</option>
                      {shopAddresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.name} - {address.street_address}, {address.city}, {address.state}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Ship to Customer Address */}
                <label className="flex items-start space-x-3 cursor-pointer opacity-50">
                  <input
                    type="radio"
                    name="shipping"
                    value="customer"
                    checked={shippingType === 'customer'}
                    onChange={(e) => setShippingType(e.target.value as 'customer')}
                    className="mt-1"
                    disabled
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Ship to Customer Address</div>
                    <div className="text-sm text-gray-600">
                      Customer addresses not available - use custom address instead
                    </div>
                  </div>
                </label>

                {/* Custom Address */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="shipping"
                    value="custom"
                    checked={shippingType === 'custom'}
                    onChange={(e) => setShippingType(e.target.value as 'custom')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Enter Custom Address</div>
                    <div className="text-sm text-gray-600">
                      Specify a different shipping address
                    </div>
                  </div>
                </label>

                {/* Custom Address Form */}
                {shippingType === 'custom' && (
                  <div className="ml-6 space-y-3">
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={customAddress.street_address}
                      onChange={(e) => setCustomAddress({...customAddress, street_address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={customAddress.city}
                        onChange={(e) => setCustomAddress({...customAddress, city: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={customAddress.state}
                        onChange={(e) => setCustomAddress({...customAddress, state: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="ZIP Code"
                        value={customAddress.zip_code}
                        onChange={(e) => setCustomAddress({...customAddress, zip_code: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={customAddress.country}
                        onChange={(e) => setCustomAddress({...customAddress, country: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Payment & Notes</h2>
            
            {/* Payment Method */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="account"
                      checked={paymentMethod === 'account'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Charge to Customer Account</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Cash</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="check"
                      checked={paymentMethod === 'check'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Check</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Credit/Debit Card</span>
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add any special instructions or notes for this order..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Order Review</h2>
            
            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Customer</h3>
              <p>{`${selectedCustomer?.first_name || ''} ${selectedCustomer?.last_name || ''}`.trim()}</p>
              {selectedCustomer?.email && <p className="text-sm text-gray-600">{selectedCustomer.email}</p>}
            </div>

            {/* Shipping Info */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Shipping</h3>
              <p className="capitalize">{shippingType === 'shop' ? 'Ship to Shop' : 
                                       shippingType === 'customer' ? 'Ship to Customer' : 
                                       'Custom Address'}</p>
              {shippingType === 'shop' && selectedShopAddress && (
                <div className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const shop = shopAddresses.find(addr => addr.id === selectedShopAddress);
                    return shop ? `${shop.name} - ${shop.street_address}, ${shop.city}, ${shop.state}` : '';
                  })()}
                </div>
              )}
              {shippingType === 'custom' && (
                <div className="text-sm text-gray-600 mt-1">
                  {customAddress.street_address}, {customAddress.city}, {customAddress.state} {customAddress.zip_code}
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Payment</h3>
              <p className="capitalize">{paymentMethod.replace('_', ' ')}</p>
              {orderNotes && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Notes:</p>
                  <p className="text-sm text-gray-600">{orderNotes}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">Order Items</h3>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
            <p className="text-gray-600">
              Your order has been successfully submitted.
            </p>
            {orderNumber && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="font-medium text-blue-900">Order Number: {orderNumber}</p>
                <p className="text-sm text-blue-700">
                  You can use this number to track your order status.
                </p>
              </div>
            )}
            <button
              onClick={onBackToShopping}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBackToShopping}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Shopping
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        {!orderSubmitted && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <div className="ml-2 text-sm font-medium text-gray-600">
                    {step === 1 && 'Customer'}
                    {step === 2 && 'Shipping'}
                    {step === 3 && 'Payment'}
                    {step === 4 && 'Review'}
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-0.5 ml-4 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        {!orderSubmitted && (
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-md ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              Previous
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!canProceedFromStep(currentStep)}
                className={`px-6 py-2 rounded-md ${
                  canProceedFromStep(currentStep)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={submitOrder}
                disabled={loading || !canProceedFromStep(currentStep)}
                className={`px-6 py-2 rounded-md ${
                  loading || !canProceedFromStep(currentStep)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Order'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

