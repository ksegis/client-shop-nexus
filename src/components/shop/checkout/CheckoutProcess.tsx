import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { shippingQuoteService } from '../../../services/shipping_quote_service';
import { dropshipOrderService } from '../../../services/dropship_order_service';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_active?: boolean;
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
  vcpn: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CustomerSearchResult {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

interface ShippingOption {
  carrierId: string;
  carrierName: string;
  serviceCode: string;
  serviceName: string;
  cost: number;
  currency: string;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate?: string;
  trackingAvailable: boolean;
  insuranceAvailable: boolean;
  signatureRequired?: boolean;
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
}

interface GroupedShippingOptions {
  cheapest?: ShippingOption;
  fastest?: ShippingOption;
  others: ShippingOption[];
}

interface CheckoutProcessProps {
  cart: CartItem[];
  totalPrice: number;
  onClearCart: () => void;
  onBackToShopping: () => void;
}

export const CheckoutProcess: React.FC<CheckoutProcessProps> = ({
  cart,
  totalPrice,
  onClearCart,
  onBackToShopping
}) => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  
  // Shipping state
  const [shippingType, setShippingType] = useState<'shop' | 'customer' | 'custom'>('shop');
  const [shopAddresses, setShopAddresses] = useState<ShopAddress[]>([]);
  const [selectedShopAddress, setSelectedShopAddress] = useState<ShopAddress | null>(null);
  const [customAddress, setCustomAddress] = useState({
    ship_to_name: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US'
  });
  
  // Shipping options state
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [groupedShippingOptions, setGroupedShippingOptions] = useState<GroupedShippingOptions>({ others: [] });
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>('');
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Order state
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderReference, setOrderReference] = useState<string>('');

  // Utility function to extract detailed error information
  const getErrorMessage = (error: any): string => {
    console.error('Full error object:', error);
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.error?.message) {
      return error.error.message;
    }
    
    if (error?.details) {
      return error.details;
    }
    
    if (error?.hint) {
      return `${error.message || 'Database error'} (Hint: ${error.hint})`;
    }
    
    if (error?.code) {
      return `Error ${error.code}: ${error.message || 'Unknown database error'}`;
    }
    
    try {
      return JSON.stringify(error);
    } catch {
      return 'An unknown error occurred';
    }
  };

  // Load shop addresses on component mount
  useEffect(() => {
    loadShopAddresses();
  }, []);

  const loadShopAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_addresses')
        .select('*')
        .eq('active', true)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error loading shop addresses:', error);
        return;
      }

      setShopAddresses(data || []);
      
      // Auto-select default or first address
      const defaultAddress = data?.find(addr => addr.is_default) || data?.[0];
      if (defaultAddress) {
        setSelectedShopAddress(defaultAddress);
      }
    } catch (error) {
      console.error('Error loading shop addresses:', error);
    }
  };

  // Customer search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerSearch.trim().length >= 2) {
        searchCustomers(customerSearch.trim());
      } else {
        setCustomerSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  const searchCustomers = async (searchTerm: string) => {
    setIsSearchingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, street_address, city, state, zip_code, country')
        .eq('role', 'customer')
        .eq('is_active', true)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error searching customers:', error);
        return;
      }

      setCustomerSearchResults(data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const selectCustomer = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || '');
    setCustomerSearchResults([]);
    
    // Auto-fill custom address with customer info if available
    if (customer.street_address) {
      setCustomAddress({
        ship_to_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        street_address: customer.street_address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        country: customer.country || 'US'
      });
    }
  };

  // Check if customer has complete address
  const customerHasAddress = (): boolean => {
    if (!selectedCustomer) return false;
    return !!(selectedCustomer.street_address && 
              selectedCustomer.city && 
              selectedCustomer.state && 
              selectedCustomer.zip_code);
  };

  // Handle shipping type change with proper state clearing
  const handleShippingTypeChange = (newType: 'shop' | 'customer' | 'custom') => {
    setShippingType(newType);
    setShippingOptions([]);
    setGroupedShippingOptions({ others: [] });
    setSelectedShippingOption('');
    setShippingQuoteError(null);
    
    // Reset custom address when switching away from custom
    if (newType !== 'custom') {
      setCustomAddress({
        ship_to_name: '',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'US'
      });
    }
  };

  // Check if address is complete
  const isAddressComplete = (address: any): boolean => {
    return !!(address?.street_address && address?.city && address?.state && address?.zip_code);
  };

  // Load shipping quotes when custom address is complete
  useEffect(() => {
    if (shippingType === 'custom' && isAddressComplete(customAddress)) {
      loadShippingQuotes();
    }
  }, [shippingType, customAddress]);

  const loadShippingQuotes = async () => {
    if (shippingType !== 'custom' || !isAddressComplete(customAddress)) {
      return;
    }

    // Validate cart items have VCPNs
    const invalidItems = cart.filter(item => !item.vcpn || item.vcpn.trim().length === 0);
    if (invalidItems.length > 0) {
      setShippingQuoteError('Some cart items are missing product codes (VCPN). Please refresh and try again.');
      return;
    }

    setIsLoadingShipping(true);
    setShippingQuoteError(null);

    try {
      console.log('🚚 Loading shipping quotes for address:', customAddress);
      console.log('📦 Cart items for shipping:', cart.map(item => ({ vcpn: item.vcpn, quantity: item.quantity })));

      const shippingItems = cart.map(item => ({
        vcpn: item.vcpn,
        quantity: item.quantity
      }));

      const shippingAddress = {
        name: customAddress.ship_to_name || `${selectedCustomer?.first_name || ''} ${selectedCustomer?.last_name || ''}`.trim(),
        address1: customAddress.street_address,
        city: customAddress.city,
        state: customAddress.state,
        zipCode: customAddress.zip_code,
        country: customAddress.country
      };

      const response = await shippingQuoteService.getShippingQuotes({
        items: shippingItems,
        shippingAddress: shippingAddress
      });

      console.log('📋 Shipping quote response:', response);

      if (response.success && Array.isArray(response.shippingOptions)) {
        setShippingOptions(response.shippingOptions);
        const grouped = groupShippingOptions(response.shippingOptions);
        setGroupedShippingOptions(grouped);
        
        // Auto-select cheapest option
        if (grouped.cheapest) {
          setSelectedShippingOption(`${grouped.cheapest.carrierId}-${grouped.cheapest.serviceCode}`);
        }
      } else {
        const errorMsg = response.message || 'Failed to load shipping options';
        setShippingQuoteError(errorMsg);
        console.error('❌ Shipping quote failed:', errorMsg);
      }
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      setShippingQuoteError(errorMsg);
      console.error('❌ Error loading shipping quotes:', error);
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Group shipping options by type
  const groupShippingOptions = (options: ShippingOption[]): GroupedShippingOptions => {
    if (!Array.isArray(options) || options.length === 0) {
      return { others: [] };
    }

    // Find cheapest and fastest options
    const cheapest = options.reduce((prev, current) => 
      (current.cost < prev.cost) ? current : prev
    );
    
    const fastest = options.reduce((prev, current) => 
      (current.estimatedDeliveryDays < prev.estimatedDeliveryDays) ? current : prev
    );

    // Get other options (excluding cheapest and fastest if they're the same)
    const others = options.filter(option => {
      const optionKey = `${option.carrierId}-${option.serviceCode}`;
      const cheapestKey = `${cheapest.carrierId}-${cheapest.serviceCode}`;
      const fastestKey = `${fastest.carrierId}-${fastest.serviceCode}`;
      
      return optionKey !== cheapestKey && optionKey !== fastestKey;
    });

    return {
      cheapest,
      fastest: fastest.cost !== cheapest.cost ? fastest : undefined,
      others
    };
  };

  // Calculate total including shipping
  const calculateTotal = (): number => {
    let total = totalPrice;
    
    if (shippingType === 'custom' && selectedShippingOption) {
      const option = shippingOptions.find(opt => 
        `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption
      );
      if (option) {
        total += option.cost;
      }
    }
    
    return total;
  };

  // Get selected shipping cost
  const getShippingCost = (): number => {
    if (shippingType === 'shop') return 0;
    if (shippingType === 'customer') return 0; // Assuming customer pickup is free
    
    if (shippingType === 'custom' && selectedShippingOption) {
      const option = shippingOptions.find(opt => 
        `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption
      );
      return option?.cost || 0;
    }
    
    return 0;
  };

  // Submit order
  const submitOrder = async () => {
    if (!selectedCustomer) {
      setOrderError('Please select a customer');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      console.log('📝 Starting order submission...');
      console.log('👤 Customer:', selectedCustomer);
      console.log('🚚 Shipping type:', shippingType);
      console.log('📦 Cart items:', cart);

      // Prepare dropship order data
      const dropshipItems = cart.map(item => ({
        vcpn: item.vcpn,
        quantity: item.quantity,
        unitPrice: item.price
      }));

      // Prepare customer info
      const customerInfo = {
        firstName: selectedCustomer.first_name || '',
        lastName: selectedCustomer.last_name || '',
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || ''
      };

      // Prepare shipping address based on type
      let shippingAddress;
      let shippingMethod = 'Standard';
      let shippingCost = 0;

      if (shippingType === 'shop' && selectedShopAddress) {
        shippingAddress = {
          name: selectedShopAddress.name,
          address1: selectedShopAddress.street_address,
          city: selectedShopAddress.city,
          state: selectedShopAddress.state,
          zipCode: selectedShopAddress.zip_code,
          country: selectedShopAddress.country
        };
        shippingMethod = 'Ship to Shop';
      } else if (shippingType === 'customer' && customerHasAddress()) {
        shippingAddress = {
          name: `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim(),
          address1: selectedCustomer.street_address || '',
          city: selectedCustomer.city || '',
          state: selectedCustomer.state || '',
          zipCode: selectedCustomer.zip_code || '',
          country: selectedCustomer.country || 'US'
        };
        shippingMethod = 'Ship to Customer';
      } else if (shippingType === 'custom') {
        shippingAddress = {
          name: customAddress.ship_to_name || `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim(),
          address1: customAddress.street_address,
          city: customAddress.city,
          state: customAddress.state,
          zipCode: customAddress.zip_code,
          country: customAddress.country
        };
        
        if (selectedShippingOption) {
          const option = shippingOptions.find(opt => 
            `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption
          );
          if (option) {
            shippingMethod = `${option.carrierName} ${option.serviceName}`;
            shippingCost = option.cost;
          }
        }
      }

      console.log('🏠 Shipping address:', shippingAddress);
      console.log('💰 Shipping cost:', shippingCost);

      // Submit order through dropship service
      const orderData = {
        items: dropshipItems,
        customer: customerInfo,
        shippingAddress: shippingAddress!,
        shippingMethod,
        paymentMethod,
        specialInstructions: orderNotes
      };

      console.log('📤 Submitting order to dropship service:', orderData);

      const result = await dropshipOrderService.placeOrder(orderData);

      if (result.success) {
        console.log('✅ Order submitted successfully:', result);
        setOrderReference(result.orderReference || 'Unknown');
        setOrderSuccess(true);
        setCurrentStep(4);
        
        // Create local backup order for tracking
        try {
          await createLocalOrder(result.orderReference || 'Unknown', shippingCost, shippingMethod);
        } catch (localError) {
          console.warn('⚠️ Failed to create local order backup:', localError);
          // Don't fail the entire order for local backup issues
        }
      } else {
        throw new Error(result.message || 'Order submission failed');
      }
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      setOrderError(errorMsg);
      console.error('❌ Order submission failed:', error);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Create local order backup
  const createLocalOrder = async (orderRef: string, shippingCost: number, shippingMethod: string) => {
    try {
      console.log('💾 Creating local order backup...');

      const orderData = {
        order_reference: orderRef,
        customer_id: selectedCustomer?.id,
        customer_first_name: selectedCustomer?.first_name,
        customer_last_name: selectedCustomer?.last_name,
        customer_email: selectedCustomer?.email,
        customer_phone: selectedCustomer?.phone,
        shipping_type: shippingType,
        shipping_cost: shippingCost,
        shipping_method: shippingMethod,
        subtotal: totalPrice,
        total_amount: calculateTotal(),
        payment_method: paymentMethod,
        special_instructions: orderNotes || null,
        order_type: 'parts',
        status: 'submitted',
        items: JSON.stringify(cart.map(item => ({
          vcpn: item.vcpn,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        })))
      };

      // Add shipping address fields based on type
      if (shippingType === 'shop' && selectedShopAddress) {
        Object.assign(orderData, {
          shipping_name: selectedShopAddress.name,
          shipping_street_address: selectedShopAddress.street_address,
          shipping_city: selectedShopAddress.city,
          shipping_state: selectedShopAddress.state,
          shipping_zip_code: selectedShopAddress.zip_code,
          shipping_country: selectedShopAddress.country
        });
      } else if (shippingType === 'customer' && customerHasAddress()) {
        Object.assign(orderData, {
          shipping_name: `${selectedCustomer?.first_name || ''} ${selectedCustomer?.last_name || ''}`.trim(),
          shipping_street_address: selectedCustomer?.street_address,
          shipping_city: selectedCustomer?.city,
          shipping_state: selectedCustomer?.state,
          shipping_zip_code: selectedCustomer?.zip_code,
          shipping_country: selectedCustomer?.country
        });
      } else if (shippingType === 'custom') {
        Object.assign(orderData, {
          shipping_name: customAddress.ship_to_name,
          shipping_street_address: customAddress.street_address,
          shipping_city: customAddress.city,
          shipping_state: customAddress.state,
          shipping_zip_code: customAddress.zip_code,
          shipping_country: customAddress.country
        });
      }

      console.log('💾 Local order data:', orderData);

      const { data, error } = await supabase
        .from('special_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating local order:', error);
        throw error;
      }

      console.log('✅ Local order created:', data);
    } catch (error) {
      console.error('❌ Failed to create local order backup:', error);
      throw error;
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
  const canProceedFromStep1 = (): boolean => {
    return !!selectedCustomer;
  };

  const canProceedFromStep2 = (): boolean => {
    if (shippingType === 'shop') {
      return !!selectedShopAddress;
    }
    if (shippingType === 'customer') {
      return customerHasAddress();
    }
    if (shippingType === 'custom') {
      return isAddressComplete(customAddress) && !!selectedShippingOption;
    }
    return false;
  };

  const canProceedFromStep3 = (): boolean => {
    return !!paymentMethod;
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Submitted Successfully!</h2>
            <p className="text-gray-600 mb-4">Your order has been submitted to our fulfillment center.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Order Reference</p>
              <p className="text-lg font-mono font-bold text-gray-900">{orderReference}</p>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p>• You will receive email updates on your order status</p>
              <p>• Tracking information will be provided once shipped</p>
              <p>• Contact us if you have any questions about your order</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={onBackToShopping}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Continue Shopping
              </button>
              <button
                onClick={onClearCart}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
          
          {/* Step Indicator */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Customer
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isSearchingCustomers && (
                      <div className="absolute right-3 top-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Search Results */}
                  {customerSearchResults.length > 0 && (
                    <div className="mt-2 border border-gray-300 rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                      {customerSearchResults.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {customer.first_name} {customer.last_name}
                          </div>
                          <div className="text-sm text-gray-600">{customer.email}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          )}
                          {customer.street_address && (
                            <div className="text-xs text-gray-500 mt-1">
                              {customer.street_address}, {customer.city}, {customer.state} {customer.zip_code}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Customer */}
                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Selected Customer</h3>
                    <div className="text-sm text-blue-800">
                      <p><strong>Name:</strong> {selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                      <p><strong>Email:</strong> {selectedCustomer.email}</p>
                      {selectedCustomer.phone && <p><strong>Phone:</strong> {selectedCustomer.phone}</p>}
                      {selectedCustomer.street_address && (
                        <p><strong>Address:</strong> {selectedCustomer.street_address}, {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.zip_code}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={onBackToShopping}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back to Shopping
                </button>
                <button
                  onClick={nextStep}
                  disabled={!canProceedFromStep1()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping Information */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
              
              <div className="space-y-4">
                {/* Ship to Shop */}
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="ship-shop"
                    name="shipping-type"
                    value="shop"
                    checked={shippingType === 'shop'}
                    onChange={(e) => handleShippingTypeChange(e.target.value as 'shop')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="ship-shop" className="block text-sm font-medium text-gray-900">
                      Ship to Shop (Free)
                    </label>
                    {shippingType === 'shop' && (
                      <div className="mt-2">
                        <select
                          value={selectedShopAddress?.id || ''}
                          onChange={(e) => {
                            const address = shopAddresses.find(addr => addr.id === e.target.value);
                            setSelectedShopAddress(address || null);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select shop location...</option>
                          {shopAddresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.name} - {address.street_address}, {address.city}, {address.state}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ship to Customer Address */}
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="ship-customer"
                    name="shipping-type"
                    value="customer"
                    checked={shippingType === 'customer'}
                    onChange={(e) => handleShippingTypeChange(e.target.value as 'customer')}
                    disabled={!customerHasAddress()}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="ship-customer" className={`block text-sm font-medium ${
                      customerHasAddress() ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      Ship to Customer Address {!customerHasAddress() && '(No address on file)'}
                    </label>
                    {shippingType === 'customer' && customerHasAddress() && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          {selectedCustomer?.first_name} {selectedCustomer?.last_name}<br />
                          {selectedCustomer?.street_address}<br />
                          {selectedCustomer?.city}, {selectedCustomer?.state} {selectedCustomer?.zip_code}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ship to Custom Address */}
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id="ship-custom"
                    name="shipping-type"
                    value="custom"
                    checked={shippingType === 'custom'}
                    onChange={(e) => handleShippingTypeChange(e.target.value as 'custom')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="ship-custom" className="block text-sm font-medium text-gray-900">
                      Ship to Custom Address
                    </label>
                    {shippingType === 'custom' && (
                      <div className="mt-4 space-y-4">
                        {/* Ship to Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ship to Name
                          </label>
                          <input
                            type="text"
                            value={customAddress.ship_to_name}
                            onChange={(e) => setCustomAddress(prev => ({ ...prev, ship_to_name: e.target.value }))}
                            placeholder="Recipient name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Street Address */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            value={customAddress.street_address}
                            onChange={(e) => setCustomAddress(prev => ({ ...prev, street_address: e.target.value }))}
                            placeholder="2810 N CHURCH ST NUM 540294"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* City, State, ZIP */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              value={customAddress.city}
                              onChange={(e) => setCustomAddress(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="WILMINGTON"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              value={customAddress.state}
                              onChange={(e) => setCustomAddress(prev => ({ ...prev, state: e.target.value }))}
                              placeholder="DE"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ZIP Code *
                            </label>
                            <input
                              type="text"
                              value={customAddress.zip_code}
                              onChange={(e) => setCustomAddress(prev => ({ ...prev, zip_code: e.target.value }))}
                              placeholder="19802"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Shipping Quote Error */}
                        {shippingQuoteError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{shippingQuoteError}</p>
                          </div>
                        )}

                        {/* Loading Shipping Options */}
                        {isLoadingShipping && (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-600">Loading shipping options...</span>
                          </div>
                        )}

                        {/* Shipping Options */}
                        {shippingOptions.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Shipping Options</h4>
                            
                            {/* Best Value (Cheapest) */}
                            {groupedShippingOptions.cheapest && (
                              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="radio"
                                      id={`shipping-${groupedShippingOptions.cheapest.carrierId}-${groupedShippingOptions.cheapest.serviceCode}`}
                                      name="shipping-option"
                                      value={`${groupedShippingOptions.cheapest.carrierId}-${groupedShippingOptions.cheapest.serviceCode}`}
                                      checked={selectedShippingOption === `${groupedShippingOptions.cheapest.carrierId}-${groupedShippingOptions.cheapest.serviceCode}`}
                                      onChange={(e) => setSelectedShippingOption(e.target.value)}
                                    />
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900">
                                          {groupedShippingOptions.cheapest.carrierName} {groupedShippingOptions.cheapest.serviceName}
                                        </span>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                          💰 Best Value
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {groupedShippingOptions.cheapest.estimatedDeliveryDays} business days • {groupedShippingOptions.cheapest.warehouseName}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-gray-900">${groupedShippingOptions.cheapest.cost.toFixed(2)}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Fastest Option */}
                            {groupedShippingOptions.fastest && (
                              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <input
                                      type="radio"
                                      id={`shipping-${groupedShippingOptions.fastest.carrierId}-${groupedShippingOptions.fastest.serviceCode}`}
                                      name="shipping-option"
                                      value={`${groupedShippingOptions.fastest.carrierId}-${groupedShippingOptions.fastest.serviceCode}`}
                                      checked={selectedShippingOption === `${groupedShippingOptions.fastest.carrierId}-${groupedShippingOptions.fastest.serviceCode}`}
                                      onChange={(e) => setSelectedShippingOption(e.target.value)}
                                    />
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900">
                                          {groupedShippingOptions.fastest.carrierName} {groupedShippingOptions.fastest.serviceName}
                                        </span>
                                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                                          ⚡ Fastest
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {groupedShippingOptions.fastest.estimatedDeliveryDays} business days • {groupedShippingOptions.fastest.warehouseName}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-gray-900">${groupedShippingOptions.fastest.cost.toFixed(2)}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Other Options (Collapsible) */}
                            {groupedShippingOptions.others.length > 0 && (
                              <div>
                                <button
                                  onClick={() => setShowOtherOptions(!showOtherOptions)}
                                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                >
                                  <span className="font-medium text-gray-900">
                                    📦 Other Options ({groupedShippingOptions.others.length})
                                  </span>
                                  <svg
                                    className={`w-5 h-5 text-gray-500 transform transition-transform ${showOtherOptions ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {showOtherOptions && (
                                  <div className="mt-2 space-y-2">
                                    {groupedShippingOptions.others.map((option) => (
                                      <div key={`${option.carrierId}-${option.serviceCode}`} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <input
                                              type="radio"
                                              id={`shipping-${option.carrierId}-${option.serviceCode}`}
                                              name="shipping-option"
                                              value={`${option.carrierId}-${option.serviceCode}`}
                                              checked={selectedShippingOption === `${option.carrierId}-${option.serviceCode}`}
                                              onChange={(e) => setSelectedShippingOption(e.target.value)}
                                            />
                                            <div>
                                              <div className="font-medium text-gray-900">
                                                {option.carrierName} {option.serviceName}
                                              </div>
                                              <div className="text-sm text-gray-600">
                                                {option.estimatedDeliveryDays} business days • {option.warehouseName}
                                                {option.trackingAvailable && ' • Tracking Available'}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="font-bold text-gray-900">${option.cost.toFixed(2)}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!canProceedFromStep2()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment & Notes */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment & Notes</h2>
              
              <div className="space-y-6">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    {['cash', 'check', 'credit_card', 'invoice'].map((method) => (
                      <div key={method} className="flex items-center">
                        <input
                          type="radio"
                          id={method}
                          name="payment-method"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-3"
                        />
                        <label htmlFor={method} className="text-sm text-gray-700 capitalize">
                          {method.replace('_', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Any special instructions for this order..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal ({cart.length} items)</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${getShippingCost().toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!canProceedFromStep3()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Order</h2>
              
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Customer</h3>
                  <p className="text-sm text-gray-700">
                    {selectedCustomer?.first_name} {selectedCustomer?.last_name}<br />
                    {selectedCustomer?.email}<br />
                    {selectedCustomer?.phone}
                  </p>
                </div>

                {/* Shipping Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Shipping</h3>
                  <div className="text-sm text-gray-700">
                    {shippingType === 'shop' && selectedShopAddress && (
                      <>
                        <p><strong>Ship to Shop (Free)</strong></p>
                        <p>{selectedShopAddress.name}</p>
                        <p>{selectedShopAddress.street_address}</p>
                        <p>{selectedShopAddress.city}, {selectedShopAddress.state} {selectedShopAddress.zip_code}</p>
                      </>
                    )}
                    {shippingType === 'customer' && (
                      <>
                        <p><strong>Ship to Customer Address</strong></p>
                        <p>{selectedCustomer?.first_name} {selectedCustomer?.last_name}</p>
                        <p>{selectedCustomer?.street_address}</p>
                        <p>{selectedCustomer?.city}, {selectedCustomer?.state} {selectedCustomer?.zip_code}</p>
                      </>
                    )}
                    {shippingType === 'custom' && (
                      <>
                        <p><strong>Ship to Custom Address</strong></p>
                        {customAddress.ship_to_name && <p>{customAddress.ship_to_name}</p>}
                        <p>{customAddress.street_address}</p>
                        <p>{customAddress.city}, {customAddress.state} {customAddress.zip_code}</p>
                        {selectedShippingOption && (
                          <p className="mt-2">
                            <strong>Shipping Method:</strong> {
                              shippingOptions.find(opt => 
                                `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption
                              )?.carrierName
                            } {
                              shippingOptions.find(opt => 
                                `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption
                              )?.serviceName
                            }
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Payment</h3>
                  <p className="text-sm text-gray-700 capitalize">
                    {paymentMethod.replace('_', ' ')}
                  </p>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} (x{item.quantity})</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${getShippingCost().toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                {orderNotes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Special Instructions</h3>
                    <p className="text-sm text-gray-700">{orderNotes}</p>
                  </div>
                )}

                {/* Order Error */}
                {orderError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{orderError}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  disabled={isSubmittingOrder}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={submitOrder}
                  disabled={isSubmittingOrder}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmittingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting Order...
                    </>
                  ) : (
                    'Submit Order'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

