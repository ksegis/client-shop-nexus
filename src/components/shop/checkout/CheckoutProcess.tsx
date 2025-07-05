import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { dropshipOrderService } from '../../../services/dropship_order_service';
import { shippingQuoteService } from '../../../services/shipping_quote_service';

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
  fastest: ShippingOption | null;
  cheapest: ShippingOption | null;
  other: ShippingOption[];
}

// Helper function to extract detailed error information
const getErrorMessage = (error: any): string => {
  console.log('Full error object:', error);
  
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
    return `Database error: ${error.hint}`;
  }
  
  if (error?.code) {
    return `Error code ${error.code}: ${error.message || 'Unknown database error'}`;
  }
  
  // Try to stringify the error for debugging
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return 'Unknown error occurred';
  }
};

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
  
  // Shipping options state
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [groupedShippingOptions, setGroupedShippingOptions] = useState<GroupedShippingOptions>({
    fastest: null,
    cheapest: null,
    other: []
  });
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>('');
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  const [shippingQuoteError, setShippingQuoteError] = useState<string | null>(null);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('account');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Order confirmation state
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

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

  // Group shipping options when they change
  useEffect(() => {
    if (shippingOptions.length > 0) {
      const grouped = groupShippingOptions(shippingOptions);
      setGroupedShippingOptions(grouped);
      
      // Auto-select cheapest option if none selected
      if (!selectedShippingOption && grouped.cheapest) {
        setSelectedShippingOption(`${grouped.cheapest.carrierId}-${grouped.cheapest.serviceCode}`);
      }
    } else {
      setGroupedShippingOptions({ fastest: null, cheapest: null, other: [] });
    }
  }, [shippingOptions]);

  // Load shipping quotes when custom address is complete
  useEffect(() => {
    if (shippingType === 'custom' && isAddressComplete(customAddress)) {
      loadShippingQuotes();
    }
  }, [shippingType, customAddress]);

  // Group shipping options by category
  const groupShippingOptions = (options: ShippingOption[]): GroupedShippingOptions => {
    if (options.length === 0) {
      return { fastest: null, cheapest: null, other: [] };
    }

    // Sort by delivery days (fastest first)
    const sortedBySpeed = [...options].sort((a, b) => a.estimatedDeliveryDays - b.estimatedDeliveryDays);
    
    // Sort by cost (cheapest first)
    const sortedByCost = [...options].sort((a, b) => a.cost - b.cost);
    
    const fastest = sortedBySpeed[0];
    const cheapest = sortedByCost[0];
    
    // Get other options (excluding fastest and cheapest if they're the same)
    const other = options.filter(option => {
      const optionKey = `${option.carrierId}-${option.serviceCode}`;
      const fastestKey = `${fastest.carrierId}-${fastest.serviceCode}`;
      const cheapestKey = `${cheapest.carrierId}-${cheapest.serviceCode}`;
      
      return optionKey !== fastestKey && optionKey !== cheapestKey;
    });

    return { fastest, cheapest, other };
  };

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

      if (error) {
        console.error('Shop addresses error:', error);
        throw error;
      }

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
      setError(`Failed to load shop addresses: ${getErrorMessage(err)}`);
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

      if (error) {
        console.error('Customer search error:', error);
        throw error;
      }

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
      setError(`Failed to search customers: ${getErrorMessage(err)}`);
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

      if (error) {
        console.error('Error fetching customer:', error);
        throw error;
      }

      setSelectedCustomer(data);
      setCustomerResults([]); // Clear search results
      setCustomerSearch(''); // Clear search input
      
    } catch (err) {
      console.error('Error selecting customer:', err);
      setError(`Failed to select customer: ${getErrorMessage(err)}`);
    }
  };

  // Check if address is complete
  const isAddressComplete = (address: any): boolean => {
    return address.street_address && 
           address.city && 
           address.state && 
           address.zip_code && 
           address.country;
  };

  // Load shipping quotes for custom address
  const loadShippingQuotes = async () => {
    if (!isAddressComplete(customAddress)) {
      return;
    }

    try {
      setShippingQuoteLoading(true);
      setShippingQuoteError(null);
      
      console.log('Loading shipping quotes for address:', customAddress);
      
      // Get VCPNs from cart items
      const vcpns = cart.map(item => item.vcpn || item.sku || item.id).filter(Boolean);
      
      if (vcpns.length === 0) {
        throw new Error('No valid part numbers found in cart');
      }

      const result = await shippingQuoteService.getShippingQuotes(vcpns, {
        address1: customAddress.street_address,
        city: customAddress.city,
        state: customAddress.state,
        zipCode: customAddress.zip_code,
        country: customAddress.country
      });

      console.log('Shipping quote result:', result);

      if (result.success && result.data) {
        setShippingOptions(result.data);
        setShippingQuoteError(null);
      } else {
        throw new Error(result.error || 'Failed to get shipping quotes');
      }
      
    } catch (err) {
      console.error('Error loading shipping quotes:', err);
      setShippingQuoteError(getErrorMessage(err));
      setShippingOptions([]);
    } finally {
      setShippingQuoteLoading(false);
    }
  };

  // Calculate total including shipping
  const calculateTotal = () => {
    let total = totalPrice;
    
    if (shippingType === 'custom' && selectedShippingOption) {
      const selectedShipping = shippingOptions.find(opt => 
        `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption
      );
      if (selectedShipping) {
        total += selectedShipping.cost;
      }
    }
    
    return total;
  };

  // Submit order using existing dropship service
  const submitOrder = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Starting order submission with dropship service...');
      console.log('Selected customer:', selectedCustomer);
      console.log('Shipping type:', shippingType);
      console.log('Cart:', cart);

      // Prepare shipping address
      let shippingAddress;
      
      if (shippingType === 'shop') {
        const shopAddr = shopAddresses.find(addr => addr.id === selectedShopAddress);
        if (!shopAddr) throw new Error('Shop address not found');
        
        shippingAddress = {
          name: shopAddr.name,
          company: shopAddr.name,
          address1: shopAddr.street_address,
          city: shopAddr.city,
          state: shopAddr.state,
          zipCode: shopAddr.zip_code,
          country: shopAddr.country
        };
        console.log('Using shop address:', shippingAddress);
      } else if (shippingType === 'custom') {
        if (!selectedShippingOption) {
          throw new Error('Please select a shipping option');
        }
        
        const selectedShipping = shippingOptions.find(opt => 
          `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption
        );
        
        if (!selectedShipping) {
          throw new Error('Selected shipping option not found');
        }
        
        shippingAddress = {
          name: `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim(),
          address1: customAddress.street_address,
          city: customAddress.city,
          state: customAddress.state,
          zipCode: customAddress.zip_code,
          country: customAddress.country,
          email: selectedCustomer.email
        };
        console.log('Using custom address:', shippingAddress);
      } else {
        throw new Error('Customer addresses not supported. Please use custom address.');
      }

      // Prepare order items for dropship service
      const orderItems = cart.map(item => ({
        vcpn: item.vcpn || item.sku || item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        description: item.name
      }));

      // Prepare customer info for dropship service
      const customerInfo = {
        firstName: selectedCustomer.first_name || '',
        lastName: selectedCustomer.last_name || '',
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || ''
      };

      // Get shipping method name
      let shippingMethod = 'standard';
      if (shippingType === 'shop') {
        shippingMethod = 'pickup';
      } else if (selectedShippingOption) {
        const selectedShipping = shippingOptions.find(opt => 
          `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption
        );
        if (selectedShipping) {
          shippingMethod = selectedShipping.serviceName;
        }
      }

      // Use existing dropship order service
      const orderRequest = {
        orderReference: '', // Will be generated by service
        customerInfo,
        shippingAddress,
        items: orderItems,
        shippingMethod,
        specialInstructions: orderNotes,
        poNumber: undefined
      };

      console.log('Submitting order with dropship service:', orderRequest);

      const result = await dropshipOrderService.placeDropshipOrder(orderRequest);

      console.log('Dropship order result:', result);

      if (result.success) {
        // Also create order in local database for tracking
        await createLocalOrder(result);
        
        setOrderResult(result);
        setOrderNumber(result.orderReference);
        setOrderSubmitted(true);
        setCurrentStep(5); // Move to confirmation step
        onClearCart(); // Clear the cart
      } else {
        throw new Error(result.message);
      }

    } catch (err) {
      console.error('Error submitting order:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Create local order record for tracking
  const createLocalOrder = async (dropshipResult: any) => {
    try {
      const selectedShipping = shippingType === 'custom' && selectedShippingOption ? 
        shippingOptions.find(opt => `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption) : null;

      const shippingCost = selectedShipping ? selectedShipping.cost : 0;
      const totalWithShipping = totalPrice + shippingCost;

      // Prepare shipping address
      let shippingAddress;
      if (shippingType === 'shop') {
        const shopAddr = shopAddresses.find(addr => addr.id === selectedShopAddress);
        shippingAddress = shopAddr ? {
          name: shopAddr.name,
          street_address: shopAddr.street_address,
          city: shopAddr.city,
          state: shopAddr.state,
          zip_code: shopAddr.zip_code,
          country: shopAddr.country
        } : null;
      } else {
        shippingAddress = {
          street_address: customAddress.street_address,
          city: customAddress.city,
          state: customAddress.state,
          zip_code: customAddress.zip_code,
          country: customAddress.country
        };
      }

      // Create order in special_orders table
      const orderData = {
        customer_id: selectedCustomer!.id,
        order_type: 'parts',
        status: 'submitted',
        total_amount: totalWithShipping,
        shipping_type: shippingType,
        shipping_address: JSON.stringify(shippingAddress),
        shipping_cost: shippingCost,
        shipping_method: selectedShipping ? `${selectedShipping.carrierName} ${selectedShipping.serviceName}` : 'Ship to Shop',
        payment_method: paymentMethod,
        notes: orderNotes,
        external_order_id: dropshipResult.keystoneOrderId,
        external_order_reference: dropshipResult.orderReference
      };

      console.log('Creating local order record:', orderData);

      const { data: order, error: orderError } = await supabase
        .from('special_orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Local order creation error:', orderError);
        // Don't throw here - the dropship order was successful
        return;
      }

      console.log('Local order created successfully:', order);

      // Create order items in order_items table
      const orderItems = cart.map(item => ({
        order_id: order.id,
        part_number: item.vcpn || item.sku || item.id,
        description: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        // Don't throw here - the main order was successful
      } else {
        console.log('Order items created successfully');
      }

    } catch (err) {
      console.error('Error creating local order record:', err);
      // Don't throw here - the dropship order was successful
    }
  };

  // Step navigation
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

  // Validation for step progression
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedCustomer !== null;
      case 2:
        if (shippingType === 'shop') {
          return selectedShopAddress !== '';
        } else if (shippingType === 'custom') {
          return isAddressComplete(customAddress) && selectedShippingOption !== '';
        }
        return false;
      case 3:
        return paymentMethod !== '';
      default:
        return true;
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 ${
              currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Render customer selection step
  const renderCustomerStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Customer Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Customer
        </label>
        <input
          type="text"
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {searchLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Searching customers...</p>
        </div>
      )}

      {customerResults.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Customer
          </label>
          {customerResults.map((customer) => (
            <div
              key={customer.id}
              onClick={() => selectCustomer(customer.id)}
              className="p-3 border border-gray-300 rounded-md cursor-pointer hover:border-gray-400 hover:bg-gray-50"
            >
              <div className="font-medium">{customer.display_name}</div>
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

      {selectedCustomer && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-800">Selected Customer:</h4>
          <p className="text-green-700">
            {selectedCustomer.first_name} {selectedCustomer.last_name}
          </p>
          <p className="text-sm text-green-600">{selectedCustomer.email}</p>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBackToShopping}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Shopping
        </button>
        <button
          onClick={nextStep}
          disabled={!canProceedToNextStep()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          Continue
        </button>
      </div>
    </div>
  );

  // Render shipping selection step
  const renderShippingStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Shipping Information</h3>

      <div className="space-y-4">
        {/* Ship to Shop Option */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              value="shop"
              checked={shippingType === 'shop'}
              onChange={(e) => setShippingType(e.target.value as 'shop' | 'customer' | 'custom')}
              className="form-radio"
            />
            <span className="font-medium">Ship to Shop (Free)</span>
          </label>
        </div>

        {shippingType === 'shop' && (
          <div className="ml-6 space-y-3">
            {shopAddresses.map((address) => (
              <label key={address.id} className="flex items-start space-x-3">
                <input
                  type="radio"
                  value={address.id}
                  checked={selectedShopAddress === address.id}
                  onChange={(e) => setSelectedShopAddress(e.target.value)}
                  className="form-radio mt-1"
                />
                <div>
                  <div className="font-medium">{address.name}</div>
                  <div className="text-sm text-gray-600">
                    {address.street_address}<br />
                    {address.city}, {address.state} {address.zip_code}
                  </div>
                  {address.is_default && (
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Default
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Ship to Custom Address Option */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              value="custom"
              checked={shippingType === 'custom'}
              onChange={(e) => setShippingType(e.target.value as 'shop' | 'customer' | 'custom')}
              className="form-radio"
            />
            <span className="font-medium">Ship to Custom Address</span>
          </label>
        </div>

        {shippingType === 'custom' && (
          <div className="ml-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                placeholder="Street Address"
                value={customAddress.street_address}
                onChange={(e) => setCustomAddress({...customAddress, street_address: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="grid grid-cols-3 gap-4">
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
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={customAddress.zip_code}
                  onChange={(e) => setCustomAddress({...customAddress, zip_code: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {shippingQuoteLoading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading shipping options...</p>
              </div>
            )}

            {shippingQuoteError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{shippingQuoteError}</p>
              </div>
            )}

            {shippingOptions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Shipping Options</h4>
                
                <div className="space-y-3">
                  {/* Cheapest Option */}
                  {groupedShippingOptions.cheapest && (
                    <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-3 flex-1">
                          <input
                            type="radio"
                            value={`${groupedShippingOptions.cheapest.carrierId}-${groupedShippingOptions.cheapest.serviceCode}`}
                            checked={selectedShippingOption === `${groupedShippingOptions.cheapest.carrierId}-${groupedShippingOptions.cheapest.serviceCode}`}
                            onChange={(e) => setSelectedShippingOption(e.target.value)}
                            className="form-radio"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{groupedShippingOptions.cheapest.serviceName}</span>
                              <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                                Best Value
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {groupedShippingOptions.cheapest.carrierName} • {groupedShippingOptions.cheapest.estimatedDeliveryDays} business days
                              {groupedShippingOptions.cheapest.warehouseName && ` • Ships from ${groupedShippingOptions.cheapest.warehouseName}`}
                            </div>
                          </div>
                        </label>
                        <div className="text-lg font-semibold text-green-600">
                          ${groupedShippingOptions.cheapest.cost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fastest Option */}
                  {groupedShippingOptions.fastest && groupedShippingOptions.fastest !== groupedShippingOptions.cheapest && (
                    <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-3 flex-1">
                          <input
                            type="radio"
                            value={`${groupedShippingOptions.fastest.carrierId}-${groupedShippingOptions.fastest.serviceCode}`}
                            checked={selectedShippingOption === `${groupedShippingOptions.fastest.carrierId}-${groupedShippingOptions.fastest.serviceCode}`}
                            onChange={(e) => setSelectedShippingOption(e.target.value)}
                            className="form-radio"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{groupedShippingOptions.fastest.serviceName}</span>
                              <span className="px-2 py-1 text-xs bg-orange-600 text-white rounded">
                                Fastest
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {groupedShippingOptions.fastest.carrierName} • {groupedShippingOptions.fastest.estimatedDeliveryDays} business days
                              {groupedShippingOptions.fastest.warehouseName && ` • Ships from ${groupedShippingOptions.fastest.warehouseName}`}
                            </div>
                          </div>
                        </label>
                        <div className="text-lg font-semibold text-orange-600">
                          ${groupedShippingOptions.fastest.cost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other Options */}
                  {groupedShippingOptions.other.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowOtherOptions(!showOtherOptions)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <span>Other Options ({groupedShippingOptions.other.length})</span>
                        <svg
                          className={`w-4 h-4 transform transition-transform ${
                            showOtherOptions ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showOtherOptions && (
                        <div className="mt-3 space-y-2">
                          {groupedShippingOptions.other.map((option) => (
                            <div key={`${option.carrierId}-${option.serviceCode}`} className="border border-gray-300 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-3 flex-1">
                                  <input
                                    type="radio"
                                    value={`${option.carrierId}-${option.serviceCode}`}
                                    checked={selectedShippingOption === `${option.carrierId}-${option.serviceCode}`}
                                    onChange={(e) => setSelectedShippingOption(e.target.value)}
                                    className="form-radio"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{option.serviceName}</div>
                                    <div className="text-sm text-gray-600">
                                      {option.carrierName} • {option.estimatedDeliveryDays} business days
                                      {option.warehouseName && ` • Ships from ${option.warehouseName}`}
                                      {option.trackingAvailable && ' • Tracking available'}
                                    </div>
                                  </div>
                                </label>
                                <div className="text-lg font-semibold">
                                  ${option.cost.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={!canProceedToNextStep()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          Continue
        </button>
      </div>
    </div>
  );

  // Render payment step
  const renderPaymentStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Payment & Notes</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="account">Charge to Account</option>
          <option value="cod">Cash on Delivery</option>
          <option value="prepaid">Prepaid</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order Notes (Optional)
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows={4}
          placeholder="Special instructions, delivery notes, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={!canProceedToNextStep()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Review Order
        </button>
      </div>
    </div>
  );

  // Render order review step
  const renderReviewStep = () => {
    const selectedShipping = shippingType === 'custom' && selectedShippingOption ? 
      shippingOptions.find(opt => `${opt.carrierId}-${opt.serviceCode}` === selectedShippingOption) : null;
    
    const shippingCost = selectedShipping ? selectedShipping.cost : 0;
    const total = calculateTotal();

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Review Your Order</h3>

        {/* Customer Info */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h4 className="font-medium mb-2">Customer</h4>
          <p>{selectedCustomer?.first_name} {selectedCustomer?.last_name}</p>
          <p className="text-sm text-gray-600">{selectedCustomer?.email}</p>
        </div>

        {/* Shipping Info */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h4 className="font-medium mb-2">Shipping</h4>
          {shippingType === 'shop' ? (
            <div>
              <p className="font-medium text-green-600">Ship to Shop (Free)</p>
              {(() => {
                const shopAddr = shopAddresses.find(addr => addr.id === selectedShopAddress);
                return shopAddr ? (
                  <div>
                    <p>{shopAddr.name}</p>
                    <p>{shopAddr.street_address}</p>
                    <p>{shopAddr.city}, {shopAddr.state} {shopAddr.zip_code}</p>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div>
              <p className="font-medium">{selectedShipping?.serviceName}</p>
              <p>{customAddress.street_address}</p>
              <p>{customAddress.city}, {customAddress.state} {customAddress.zip_code}</p>
              <p className="text-sm text-gray-600 mt-2">
                Shipping: ${shippingCost.toFixed(2)} ({selectedShipping?.estimatedDeliveryDays} business days)
              </p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h4 className="font-medium mb-2">Items ({cart.length})</h4>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.vcpn && `VCPN: ${item.vcpn}`}
                    {item.sku && !item.vcpn && `SKU: ${item.sku}`}
                  </p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total */}
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h4 className="font-medium mb-2">Payment Method</h4>
          <p className="capitalize">{paymentMethod.replace('_', ' ')}</p>
        </div>

        {/* Order Notes */}
        {orderNotes && (
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-medium mb-2">Order Notes</h4>
            <p className="text-gray-700">{orderNotes}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={submitOrder}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Placing Order...</span>
              </>
            ) : (
              <span>Place Order</span>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render confirmation step
  const renderConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h3 className="text-2xl font-bold text-green-600">Order Placed Successfully!</h3>
      
      {orderResult && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800">Order Details</h4>
            <div className="mt-2 space-y-1 text-sm">
              <p><strong>Order Reference:</strong> {orderResult.orderReference}</p>
              {orderResult.keystoneOrderId && (
                <p><strong>Keystone Order ID:</strong> {orderResult.keystoneOrderId}</p>
              )}
              <p><strong>Total Items:</strong> {orderResult.totalItems}</p>
              {orderResult.totalValue && (
                <p><strong>Total Value:</strong> ${orderResult.totalValue.toFixed(2)}</p>
              )}
              {orderResult.estimatedDeliveryDate && (
                <p><strong>Estimated Delivery:</strong> {new Date(orderResult.estimatedDeliveryDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {orderResult.trackingInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800">Tracking Information</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p><strong>Carrier:</strong> {orderResult.trackingInfo.carrier}</p>
                {orderResult.trackingInfo.trackingNumber && (
                  <p><strong>Tracking Number:</strong> {orderResult.trackingInfo.trackingNumber}</p>
                )}
                {orderResult.trackingInfo.trackingUrl && (
                  <a 
                    href={orderResult.trackingInfo.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Track Your Package
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={onBackToShopping}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue Shopping
        </button>
        <button
          onClick={() => window.print()}
          className="w-full px-6 py-3 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          Print Order Confirmation
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-2">Checkout</h2>
        {!orderSubmitted && renderStepIndicator()}
      </div>

      {currentStep === 1 && renderCustomerStep()}
      {currentStep === 2 && renderShippingStep()}
      {currentStep === 3 && renderPaymentStep()}
      {currentStep === 4 && renderReviewStep()}
      {currentStep === 5 && renderConfirmationStep()}
    </div>
  );
};

