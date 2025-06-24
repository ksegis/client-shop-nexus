import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, X, Minus, Trash2, ArrowRight, DollarSign, TrendingUp, TrendingDown, Truck, MapPin, Clock, Shield, Edit, CheckCircle, Timer, User, CreditCard, FileText, Star, Zap, UserSearch, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the ProductPriceCheck component
import ProductPriceCheck from '@/components/product_price_check_component';

// Import enhanced cart system with shipping
import { useCart } from '@/lib/minimal_cart_context';
import { AddToCartButton, CartWidget } from '@/components/minimal_cart_components';

// Import existing services - FIXED: Import singleton instances instead of classes
import { shippingQuoteService } from '@/services/shipping_quote_service';
import { DropshipOrderService } from '@/services/dropship_order_service';

// Import customer search service
import { CustomerSearchService } from '@/services/customer_search_service';

// Customer search result interface
interface CustomerSearchResult {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  display_name: string;
}

// Customer record interface
interface CustomerRecord {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'customer' | 'staff' | 'admin';
  created_at: string;
  updated_at: string;
}

// Simplified interface for inventory parts
interface InventoryPart {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  price: number;
  cost?: number;
  category?: string;
  supplier?: string;
  reorder_level?: number;
  created_at: string;
  updated_at: string;
  core_charge?: number;
  keystone_vcpn?: string;
  keystone_synced?: boolean;
  keystone_last_sync?: string;
  
  // Optional additional columns
  warehouse?: string;
  location?: string;
  brand?: string;
  weight?: number;
  dimensions?: string;
  warranty?: string;
  list_price?: number;
  discount_percentage?: number;
}

// Customer interface for special orders
interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
}

// Shipping address interface
interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Shipping option interface
interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  deliveryDate: string;
}

// Grouped shipping options interface
interface GroupedShippingOptions {
  bestValue: ShippingOption | null;
  fastest: ShippingOption | null;
  others: ShippingOption[];
}

// Loading wrapper component
const LoadingWrapper = ({ isLoading, children, message = "Loading..." }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </div>
    );
  }
  return children;
};

// Customer Search Component
const CustomerSearchComponent = ({ 
  onCustomerSelect, 
  selectedCustomer 
}: {
  onCustomerSelect: (customer: CustomerSearchResult | null) => void;
  selectedCustomer: CustomerSearchResult | null;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  // Debounced search function
  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await CustomerSearchService.searchCustomers(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Customer search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search customers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCustomers]);

  const handleCustomerSelect = (customer: CustomerSearchResult) => {
    onCustomerSelect(customer);
    setSearchQuery(customer.display_name);
    setShowResults(false);
  };

  const clearSelection = () => {
    onCustomerSelect(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <UserSearch className="h-4 w-4" />
        <Label className="text-sm font-medium">Search Existing Customer</Label>
      </div>
      
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8"
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-1/2 transform -translate-y-1/2" />
            )}
          </div>
          {selectedCustomer && (
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {searchResults.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{customer.display_name}</div>
                <div className="text-sm text-gray-500">{customer.email}</div>
                {customer.phone && (
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
            <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <div className="text-sm">No existing customers found</div>
            <div className="text-xs text-gray-400 mt-1">A new customer will be created</div>
          </div>
        )}
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Customer Selected</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="font-medium">{selectedCustomer.display_name}</div>
            <div className="text-gray-600">{selectedCustomer.email}</div>
            {selectedCustomer.phone && (
              <div className="text-gray-600">{selectedCustomer.phone}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Pricing display component with ProductPriceCheck integration
const PricingDisplay = ({ part, className = "" }) => {
  const [showPriceCheck, setShowPriceCheck] = useState(false);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-green-600">${part.price}</span>
        {part.keystone_vcpn && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPriceCheck(!showPriceCheck)}
            className="h-6 px-2 text-xs"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Check Price
          </Button>
        )}
      </div>
      
      {part.cost && (
        <div className="text-xs text-muted-foreground">
          Cost: ${part.cost} | Margin: {((part.price - part.cost) / part.cost * 100).toFixed(1)}%
        </div>
      )}
      
      {part.list_price && part.list_price > part.price && (
        <div className="text-xs text-muted-foreground line-through">
          List: ${part.list_price}
        </div>
      )}

      {showPriceCheck && part.keystone_vcpn && (
        <div className="mt-2 p-2 border rounded-lg bg-gray-50">
          <ProductPriceCheck vcpn={part.keystone_vcpn} />
        </div>
      )}
    </div>
  );
};

// Enhanced Shipping Options Component with Amazon-style grouping
const ShippingOptionsDisplay = ({ 
  shippingOptions, 
  selectedShipping, 
  onShippingSelect 
}: {
  shippingOptions: ShippingOption[];
  selectedShipping: string;
  onShippingSelect: (optionId: string) => void;
}) => {
  // State for collapsible "Other Options" section
  const [showOtherOptions, setShowOtherOptions] = useState(false);

  // Group shipping options by best value and fastest delivery
  const groupedOptions = useMemo((): GroupedShippingOptions => {
    if (shippingOptions.length === 0) {
      return { bestValue: null, fastest: null, others: [] };
    }

    // Find best value (lowest cost)
    const bestValue = shippingOptions.reduce((prev, current) => 
      prev.cost < current.cost ? prev : current
    );

    // Find fastest delivery (lowest estimated days)
    const fastest = shippingOptions.reduce((prev, current) => 
      prev.estimatedDays < current.estimatedDays ? prev : current
    );

    // Get remaining options (excluding best value and fastest if they're different)
    const others = shippingOptions.filter(option => 
      option.id !== bestValue.id && option.id !== fastest.id
    );

    return { bestValue, fastest, others };
  }, [shippingOptions]);

  const ShippingOptionCard = ({ 
    option, 
    isRecommended = false, 
    recommendationType = '',
    icon = null 
  }: {
    option: ShippingOption;
    isRecommended?: boolean;
    recommendationType?: string;
    icon?: React.ReactNode;
  }) => (
    <div className={`border rounded-lg p-4 transition-all hover:shadow-md ${
      selectedShipping === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    } ${isRecommended ? 'border-green-500' : ''}`}>
      <label className="flex items-center space-x-3 cursor-pointer">
        <input
          type="radio"
          name="shipping"
          value={option.id}
          checked={selectedShipping === option.id}
          onChange={(e) => onShippingSelect(e.target.value)}
          className="text-blue-600"
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isRecommended && (
                <div className="flex items-center gap-1 mb-1">
                  {icon}
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    {recommendationType}
                  </Badge>
                </div>
              )}
              <div className="font-medium text-lg">{option.carrier} {option.service}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Estimated delivery: {new Date(option.deliveryDate).toLocaleDateString()} 
                <span className="ml-1">({option.estimatedDays} business days)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">${option.cost.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </label>
    </div>
  );

  if (shippingOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-lg">Select Shipping Method</h4>
      
      {/* Best Value Option */}
      {groupedOptions.bestValue && (
        <div>
          <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Best Value
          </h5>
          <ShippingOptionCard 
            option={groupedOptions.bestValue}
            isRecommended={true}
            recommendationType="Best Value"
            icon={<DollarSign className="h-3 w-3 text-green-600" />}
          />
        </div>
      )}

      {/* Fastest Delivery Option (only if different from best value) */}
      {groupedOptions.fastest && groupedOptions.fastest.id !== groupedOptions.bestValue?.id && (
        <div>
          <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Fastest Delivery
          </h5>
          <ShippingOptionCard 
            option={groupedOptions.fastest}
            isRecommended={true}
            recommendationType="Fastest"
            icon={<Zap className="h-3 w-3 text-blue-600" />}
          />
        </div>
      )}

      {/* Other Options - Collapsible */}
      {groupedOptions.others.length > 0 && (
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowOtherOptions(!showOtherOptions)}
            className="h-auto p-0 text-sm font-medium text-gray-700 hover:text-gray-900 mb-2 flex items-center gap-2"
          >
            {showOtherOptions ? (
              <ArrowRight className="h-4 w-4 rotate-90 transition-transform" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform" />
            )}
            Other Options ({groupedOptions.others.length})
          </Button>
          
          {showOtherOptions && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              {groupedOptions.others.map((option) => (
                <ShippingOptionCard key={option.id} option={option} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary info */}
      <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-1 mb-1">
          <Shield className="h-3 w-3" />
          <span className="font-medium">Shipping Information</span>
        </div>
        <ul className="space-y-1 ml-4">
          <li>• All shipping options include tracking</li>
          <li>• Delivery times are business days</li>
          <li>• Insurance available for valuable items</li>
          <li>• Prices are estimates and may vary</li>
        </ul>
      </div>
    </div>
  );
};

// Special Orders Component with Customer Lookup
const SpecialOrdersTab = () => {
  const { items, clearCart, total } = useCart();
  const { toast } = useToast();
  
  // State for checkout process
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [customer, setCustomer] = useState<Customer>({
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
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  // Handle customer selection from search
  const handleCustomerSelect = (customer: CustomerSearchResult | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      // Auto-populate customer information
      setCustomer({
        firstName: customer.first_name || '',
        lastName: customer.last_name || '',
        email: customer.email,
        phone: customer.phone || '',
        company: ''
      });
    } else {
      // Clear customer information
      setCustomer({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: ''
      });
    }
  };

  // Load shipping quotes - FIXED: Use singleton instance and correct parameter structure
  const loadShippingQuotes = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: "Address Required",
        description: "Please fill in all shipping address fields to get quotes.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingShipping(true);
    try {
      // FIXED: Use singleton instance and correct parameter structure
      const response = await shippingQuoteService.getShippingQuotes({
        items: items.map(item => ({
          vcpn: item.id,
          quantity: item.quantity
        })),
        shippingAddress: {
          address1: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country
        }
      });

      if (response.success && response.shippingOptions && response.shippingOptions.length > 0) {
        // Transform the response to match our ShippingOption interface
        const transformedOptions = response.shippingOptions.map(option => ({
          id: `${option.carrierId}_${option.serviceCode}_${option.warehouseId}`,
          carrier: option.carrierName,
          service: option.serviceName,
          cost: option.cost,
          estimatedDays: option.estimatedDeliveryDays,
          deliveryDate: option.estimatedDeliveryDate || new Date(Date.now() + option.estimatedDeliveryDays * 24 * 60 * 60 * 1000).toISOString()
        }));

        setShippingOptions(transformedOptions);
        toast({
          title: "Shipping Quotes Loaded",
          description: `Found ${transformedOptions.length} shipping options.`
        });
      } else {
        toast({
          title: "No Shipping Options",
          description: response.message || "No shipping options available for this address.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading shipping quotes:', error);
      toast({
        title: "Shipping Error",
        description: "Failed to load shipping quotes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Place order with customer creation
  const placeOrder = async () => {
    if (!selectedShipping) {
      toast({
        title: "Shipping Required",
        description: "Please select a shipping option.",
        variant: "destructive"
      });
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Create customer if not already exists
      let customerRecord: CustomerRecord | null = null;
      if (!selectedCustomer) {
        // Create new customer
        try {
          customerRecord = await CustomerSearchService.createCustomerFromOrder(
            customer.email,
            customer.firstName,
            customer.lastName,
            customer.phone
          );
          toast({
            title: "Customer Created",
            description: `New customer account created for ${customer.email}`,
          });
        } catch (error) {
          console.error('Error creating customer:', error);
          // Continue with order placement even if customer creation fails
          toast({
            title: "Customer Creation Warning",
            description: "Order will proceed, but customer account creation failed.",
            variant: "destructive"
          });
        }
      }

      const selectedOption = shippingOptions.find(opt => opt.id === selectedShipping);
      
      const orderData = {
        customer,
        shippingAddress,
        items: items.map(item => `${item.id}:${item.quantity}`).join(','),
        shippingMethod: selectedOption?.service || 'Standard',
        specialInstructions: `Cart order - ${items.length} items, Total: $${total.toFixed(2)}${customerRecord ? `, Customer ID: ${customerRecord.id}` : ''}`
      };

      const result = await DropshipOrderService.placeOrder(orderData);
      
      if (result.success) {
        setOrderResult(result);
        setOrderComplete(true);
        clearCart();
        toast({
          title: "Order Placed Successfully!",
          description: `Order ${result.orderReference} has been submitted.`
        });
      } else {
        throw new Error(result.error || 'Order placement failed');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Reset checkout process
  const resetCheckout = () => {
    setCurrentStep(1);
    setOrderComplete(false);
    setOrderResult(null);
    setSelectedShipping('');
    setShippingOptions([]);
    setSelectedCustomer(null);
    setCustomer({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: ''
    });
  };

  // Calculate totals
  const subtotal = total;
  const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping);
  const shippingCost = selectedShippingOption?.cost || 0;
  const tax = (subtotal + shippingCost) * 0.08; // 8% tax
  const grandTotal = subtotal + shippingCost + tax;

  if (orderComplete && orderResult) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Order Placed Successfully!</CardTitle>
            <CardDescription>Your special order has been submitted and is being processed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Order Reference:</span>
                  <span className="font-mono">{orderResult.orderReference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tracking Number:</span>
                  <span className="font-mono">{orderResult.trackingNumber || 'Will be provided when shipped'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                You will receive email updates about your order status.
              </p>
              <Button onClick={resetCheckout} className="w-full">
                Place Another Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Special Orders</h1>
        <p className="text-muted-foreground">Complete your cart checkout and place a special order</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-4">Add items to your cart from the Parts tab to place a special order.</p>
            <Button onClick={() => {
              // Switch to parts tab
              const url = new URL(window.location);
              url.searchParams.set('tab', 'parts');
              window.history.pushState({}, '', url);
              window.location.reload();
            }}>
              Browse Parts
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main checkout flow */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Checkout Process
                </CardTitle>
                <div className="flex items-center gap-2 mt-4">
                  {[1, 2, 3, 4].map((step) => (
                    <React.Fragment key={step}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && (
                        <div className={`flex-1 h-1 ${
                          currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Cart Review</span>
                  <span>Customer Info</span>
                  <span>Shipping</span>
                  <span>Place Order</span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Step 1: Cart Review */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Review Your Cart</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.id} • Qty: {item.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">${item.price} each</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-lg font-semibold">Subtotal:</span>
                      <span className="text-lg font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <Button onClick={() => setCurrentStep(2)} className="w-full">
                      Continue to Customer Information
                    </Button>
                  </div>
                )}

                {/* Step 2: Customer Information with Search */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Customer Information</h3>
                    
                    {/* Customer Search Component */}
                    <CustomerSearchComponent
                      onCustomerSelect={handleCustomerSelect}
                      selectedCustomer={selectedCustomer}
                    />

                    <Separator />

                    {/* Manual Customer Information Form */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <Label className="text-sm font-medium">
                          {selectedCustomer ? 'Review Customer Information' : 'Enter Customer Information'}
                        </Label>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={customer.firstName}
                            onChange={(e) => setCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={customer.lastName}
                            onChange={(e) => setCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={customer.email}
                            onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={customer.phone}
                            onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="company">Company (Optional)</Label>
                          <Input
                            id="company"
                            value={customer.company}
                            onChange={(e) => setCustomer(prev => ({ ...prev, company: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(3)}
                        disabled={!customer.firstName || !customer.lastName || !customer.email || !customer.phone}
                        className="flex-1"
                      >
                        Continue to Shipping
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Shipping Information */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Shipping Information</h3>
                    
                    {/* Shipping Address */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Shipping Address</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={shippingAddress.city}
                              onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={shippingAddress.state}
                              onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="zipCode">ZIP Code</Label>
                            <Input
                              id="zipCode"
                              value={shippingAddress.zipCode}
                              onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Select value={shippingAddress.country} onValueChange={(value) => setShippingAddress(prev => ({ ...prev, country: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="CA">Canada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={loadShippingQuotes}
                        disabled={isLoadingShipping || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode}
                        className="w-full"
                      >
                        {isLoadingShipping ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading Shipping Options...
                          </>
                        ) : (
                          <>
                            <Truck className="h-4 w-4 mr-2" />
                            Get Shipping Quotes
                          </>
                        )}
                      </Button>

                      {/* Enhanced Shipping Options Display */}
                      {shippingOptions.length > 0 && (
                        <ShippingOptionsDisplay
                          shippingOptions={shippingOptions}
                          selectedShipping={selectedShipping}
                          onShippingSelect={setSelectedShipping}
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        Back
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(4)}
                        disabled={!selectedShipping}
                        className="flex-1"
                      >
                        Review Order
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review and Place Order */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Review Your Order</h3>
                    
                    {/* Order Summary */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Customer Information</h4>
                        <div className="text-sm space-y-1">
                          <div>{customer.firstName} {customer.lastName}</div>
                          <div>{customer.email}</div>
                          <div>{customer.phone}</div>
                          {customer.company && <div>{customer.company}</div>}
                          {selectedCustomer && (
                            <div className="text-green-600 text-xs mt-2">
                              ✓ Existing customer account
                            </div>
                          )}
                          {!selectedCustomer && (
                            <div className="text-blue-600 text-xs mt-2">
                              ℹ New customer account will be created
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Shipping Address</h4>
                        <div className="text-sm space-y-1">
                          <div>{shippingAddress.street}</div>
                          <div>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</div>
                          <div>{shippingAddress.country}</div>
                        </div>
                      </div>

                      {selectedShippingOption && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">Shipping Method</h4>
                          <div className="text-sm space-y-1">
                            <div>{selectedShippingOption.carrier} {selectedShippingOption.service}</div>
                            <div>Estimated delivery: {new Date(selectedShippingOption.deliveryDate).toLocaleDateString()}</div>
                            <div className="font-semibold">${selectedShippingOption.cost.toFixed(2)}</div>
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Order Total</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>${shippingCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>${tax.toFixed(2)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Total:</span>
                            <span>${grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCurrentStep(3)}>
                        Back
                      </Button>
                      <Button 
                        onClick={placeOrder}
                        disabled={isPlacingOrder}
                        className="flex-1"
                      >
                        {isPlacingOrder ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Place Order
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-muted-foreground">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div>${(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  {(subtotal + shippingCost) > 0 && (
                    <div className="flex justify-between">
                      <span>Tax (8%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Parts component with tab functionality
const Parts = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Get current tab from URL
  const [currentTab, setCurrentTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'parts';
  });

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('tab', currentTab);
    window.history.replaceState({}, '', url);
  }, [currentTab]);

  // Mock data for parts with enhanced fields
  const mockParts: InventoryPart[] = [
    {
      id: 'PART-001',
      name: 'Premium Brake Pads',
      description: 'High-performance ceramic brake pads for superior stopping power',
      sku: 'BP-PREM-001',
      quantity: 25,
      price: 89.99,
      cost: 45.00,
      category: 'Brakes',
      supplier: 'BrakeTech Industries',
      reorder_level: 10,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      core_charge: 15.00,
      keystone_vcpn: 'BT-BP-001',
      keystone_synced: true,
      keystone_last_sync: '2024-01-20T14:30:00Z',
      warehouse: 'Main',
      location: 'A-15-B',
      brand: 'BrakeTech',
      weight: 2.5,
      dimensions: '12x8x2 inches',
      warranty: '2 years',
      list_price: 129.99,
      discount_percentage: 30.8
    },
    {
      id: 'PART-002',
      name: 'Oil Filter - Standard',
      description: 'Standard oil filter for most passenger vehicles',
      sku: 'OF-STD-002',
      quantity: 150,
      price: 12.99,
      cost: 6.50,
      category: 'Filters',
      supplier: 'FilterMax Corp',
      reorder_level: 50,
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-18T11:15:00Z',
      keystone_vcpn: 'FM-OF-002',
      keystone_synced: true,
      keystone_last_sync: '2024-01-18T11:15:00Z',
      warehouse: 'Main',
      location: 'B-22-C',
      brand: 'FilterMax',
      weight: 0.8,
      dimensions: '4x4x3 inches',
      warranty: '1 year',
      list_price: 18.99,
      discount_percentage: 31.6
    },
    {
      id: 'PART-003',
      name: 'LED Headlight Bulb Set',
      description: 'Ultra-bright LED headlight conversion kit',
      sku: 'LED-HL-003',
      quantity: 8,
      price: 159.99,
      cost: 85.00,
      category: 'Lighting',
      supplier: 'BrightLite Solutions',
      reorder_level: 5,
      created_at: '2024-01-12T13:00:00Z',
      updated_at: '2024-01-19T16:45:00Z',
      keystone_vcpn: 'BL-LED-003',
      keystone_synced: false,
      warehouse: 'Main',
      location: 'C-08-A',
      brand: 'BrightLite',
      weight: 1.2,
      dimensions: '8x6x4 inches',
      warranty: '3 years',
      list_price: 199.99,
      discount_percentage: 20.0
    },
    {
      id: 'PART-004',
      name: 'Transmission Fluid - ATF',
      description: 'Automatic transmission fluid for smooth shifting',
      sku: 'TF-ATF-004',
      quantity: 75,
      price: 24.99,
      cost: 12.00,
      category: 'Fluids',
      supplier: 'FluidTech Industries',
      reorder_level: 25,
      created_at: '2024-01-08T08:30:00Z',
      updated_at: '2024-01-17T10:20:00Z',
      keystone_vcpn: 'FT-ATF-004',
      keystone_synced: true,
      keystone_last_sync: '2024-01-17T10:20:00Z',
      warehouse: 'Secondary',
      location: 'D-12-B',
      brand: 'FluidTech',
      weight: 2.1,
      dimensions: '6x4x10 inches',
      warranty: 'N/A',
      list_price: 29.99,
      discount_percentage: 16.7
    },
    {
      id: 'PART-005',
      name: 'Spark Plug Set (4-pack)',
      description: 'Iridium spark plugs for enhanced performance',
      sku: 'SP-IR-005',
      quantity: 40,
      price: 45.99,
      cost: 22.50,
      category: 'Engine',
      supplier: 'IgnitionPro',
      reorder_level: 15,
      created_at: '2024-01-14T11:45:00Z',
      updated_at: '2024-01-21T09:10:00Z',
      keystone_vcpn: 'IP-SP-005',
      keystone_synced: true,
      keystone_last_sync: '2024-01-21T09:10:00Z',
      warehouse: 'Main',
      location: 'A-05-C',
      brand: 'IgnitionPro',
      weight: 0.6,
      dimensions: '5x3x2 inches',
      warranty: '2 years',
      list_price: 59.99,
      discount_percentage: 23.3
    },
    {
      id: 'PART-006',
      name: 'Air Filter - High Flow',
      description: 'High-flow air filter for increased engine performance',
      sku: 'AF-HF-006',
      quantity: 30,
      price: 34.99,
      cost: 18.00,
      category: 'Filters',
      supplier: 'AirFlow Dynamics',
      reorder_level: 12,
      created_at: '2024-01-11T14:20:00Z',
      updated_at: '2024-01-19T12:30:00Z',
      keystone_vcpn: 'AD-AF-006',
      keystone_synced: true,
      keystone_last_sync: '2024-01-19T12:30:00Z',
      warehouse: 'Main',
      location: 'B-18-A',
      brand: 'AirFlow',
      weight: 1.1,
      dimensions: '10x8x2 inches',
      warranty: '1 year',
      list_price: 44.99,
      discount_percentage: 22.2
    },
    {
      id: 'PART-007',
      name: 'Radiator Coolant - 50/50',
      description: 'Pre-mixed antifreeze coolant for optimal engine temperature',
      sku: 'RC-5050-007',
      quantity: 60,
      price: 18.99,
      cost: 9.50,
      category: 'Fluids',
      supplier: 'CoolTech Solutions',
      reorder_level: 20,
      created_at: '2024-01-09T16:00:00Z',
      updated_at: '2024-01-18T13:45:00Z',
      keystone_vcpn: 'CT-RC-007',
      keystone_synced: true,
      keystone_last_sync: '2024-01-18T13:45:00Z',
      warehouse: 'Secondary',
      location: 'D-25-C',
      brand: 'CoolTech',
      weight: 8.5,
      dimensions: '8x6x12 inches',
      warranty: 'N/A',
      list_price: 24.99,
      discount_percentage: 24.0
    },
    {
      id: 'PART-008',
      name: 'Windshield Wipers - All Season',
      description: 'Durable all-season windshield wipers',
      sku: 'WW-AS-008',
      quantity: 45,
      price: 28.99,
      cost: 14.50,
      category: 'Exterior',
      supplier: 'ClearView Auto',
      reorder_level: 18,
      created_at: '2024-01-13T10:15:00Z',
      updated_at: '2024-01-20T15:20:00Z',
      keystone_vcpn: 'CV-WW-008',
      keystone_synced: false,
      warehouse: 'Main',
      location: 'E-10-B',
      brand: 'ClearView',
      weight: 1.8,
      dimensions: '24x2x2 inches',
      warranty: '6 months',
      list_price: 39.99,
      discount_percentage: 27.5
    },
    {
      id: 'PART-009',
      name: 'Battery - 12V AGM',
      description: 'Absorbed Glass Mat battery for reliable starting power',
      sku: 'BAT-AGM-009',
      quantity: 12,
      price: 189.99,
      cost: 95.00,
      category: 'Electrical',
      supplier: 'PowerCell Industries',
      reorder_level: 6,
      created_at: '2024-01-07T12:30:00Z',
      updated_at: '2024-01-16T14:10:00Z',
      core_charge: 25.00,
      keystone_vcpn: 'PC-BAT-009',
      keystone_synced: true,
      keystone_last_sync: '2024-01-16T14:10:00Z',
      warehouse: 'Main',
      location: 'F-03-A',
      brand: 'PowerCell',
      weight: 45.2,
      dimensions: '12x7x8 inches',
      warranty: '3 years',
      list_price: 249.99,
      discount_percentage: 24.0
    },
    {
      id: 'PART-010',
      name: 'Tire Pressure Sensor',
      description: 'TPMS sensor for accurate tire pressure monitoring',
      sku: 'TPS-TPMS-010',
      quantity: 20,
      price: 67.99,
      cost: 34.00,
      category: 'Sensors',
      supplier: 'SensorTech Corp',
      reorder_level: 8,
      created_at: '2024-01-16T09:45:00Z',
      updated_at: '2024-01-21T11:30:00Z',
      keystone_vcpn: 'ST-TPS-010',
      keystone_synced: true,
      keystone_last_sync: '2024-01-21T11:30:00Z',
      warehouse: 'Main',
      location: 'G-14-C',
      brand: 'SensorTech',
      weight: 0.3,
      dimensions: '3x3x2 inches',
      warranty: '2 years',
      list_price: 89.99,
      discount_percentage: 24.4
    }
  ];

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(mockParts.map(part => part.category)))];

  // Filter and sort parts
  const filteredParts = useMemo(() => {
    let filtered = mockParts.filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || part.category === selectedCategory;
      const matchesPrice = part.price >= priceRange[0] && part.price <= priceRange[1];
      const matchesFavorites = !showFavoritesOnly || favorites.has(part.id);
      
      return matchesSearch && matchesCategory && matchesPrice && matchesFavorites;
    });

    // Sort parts
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'updated':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [mockParts, searchTerm, selectedCategory, priceRange, sortBy, sortOrder, favorites, showFavoritesOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange, sortBy, sortOrder, showFavoritesOnly]);

  // Toggle favorite
  const toggleFavorite = (partId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(partId)) {
        newFavorites.delete(partId);
      } else {
        newFavorites.add(partId);
      }
      return newFavorites;
    });
  };

  // Refresh data
  const refreshData = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast({
      title: "Data Refreshed",
      description: "Parts inventory has been updated."
    });
  };

  // Part card component
  const PartCard = ({ part }: { part: InventoryPart }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-gray-300">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">
              {part.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {part.description}
            </p>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {part.category}
              </Badge>
              {part.keystone_synced && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  Synced
                </Badge>
              )}
              {part.quantity <= part.reorder_level && (
                <Badge variant="destructive" className="text-xs">
                  Low Stock
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(part.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className={`h-4 w-4 ${favorites.has(part.id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">SKU:</span>
            <span className="font-mono">{part.sku}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Stock:</span>
            <span className={`font-medium ${part.quantity <= part.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
              {part.quantity} units
            </span>
          </div>
          {part.warehouse && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Location:</span>
              <span>{part.warehouse} - {part.location}</span>
            </div>
          )}
        </div>

        <PricingDisplay part={part} className="mb-4" />

        <div className="flex gap-2">
          <AddToCartButton 
            part={{
              id: part.id,
              name: part.name,
              price: part.price,
              quantity: part.quantity
            }}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPart(part)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // List view component
  const PartListItem = ({ part }: { part: InventoryPart }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            <div className="md:col-span-2">
              <h3 className="font-semibold text-lg mb-1">{part.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{part.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{part.category}</Badge>
                {part.keystone_synced && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">Synced</Badge>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">SKU</div>
              <div className="font-mono text-sm">{part.sku}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Stock</div>
              <div className={`font-medium ${part.quantity <= part.reorder_level ? 'text-red-600' : 'text-green-600'}`}>
                {part.quantity}
              </div>
            </div>
            
            <div className="text-center">
              <PricingDisplay part={part} />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(part.id)}
              >
                <Heart className={`h-4 w-4 ${favorites.has(part.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <AddToCartButton 
                part={{
                  id: part.id,
                  name: part.name,
                  price: part.price,
                  quantity: part.quantity
                }}
                size="sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPart(part)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Cart Widget */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parts & Special Orders</h1>
          <p className="text-muted-foreground">Browse parts inventory and place special orders</p>
        </div>
        <CartWidget />
      </div>

      {/* Tab Navigation */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parts" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Parts Catalog
          </TabsTrigger>
          <TabsTrigger value="special-orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Special Orders
          </TabsTrigger>
        </TabsList>

        {/* Parts Tab Content */}
        <TabsContent value="parts" className="space-y-6">
          {/* Filters and Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search Parts</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, SKU, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <Label htmlFor="sort">Sort By</Label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="quantity">Stock</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="updated">Last Updated</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* View Mode */}
                <div className="space-y-2">
                  <Label>View Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshData}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Price Range and Favorites */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="favorites-only"
                    checked={showFavoritesOnly}
                    onCheckedChange={setShowFavoritesOnly}
                  />
                  <Label htmlFor="favorites-only">Show favorites only</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedParts.length} of {filteredParts.length} parts
              {showFavoritesOnly && ` (${favorites.size} favorites)`}
            </div>
          </div>

          {/* Parts Grid/List */}
          <LoadingWrapper isLoading={isLoading} message="Loading parts...">
            {paginatedParts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No parts found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedParts.map(part => (
                      <PartCard key={part.id} part={part} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedParts.map(part => (
                      <PartListItem key={part.id} part={part} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                        if (page > totalPages) return null;
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </LoadingWrapper>
        </TabsContent>

        {/* Special Orders Tab Content */}
        <TabsContent value="special-orders">
          <SpecialOrdersTab />
        </TabsContent>
      </Tabs>

      {/* Part Detail Dialog */}
      {selectedPart && (
        <Dialog open={!!selectedPart} onOpenChange={() => setSelectedPart(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPart.name}</DialogTitle>
              <DialogDescription>{selectedPart.description}</DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SKU:</span>
                      <span className="font-mono">{selectedPart.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{selectedPart.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Brand:</span>
                      <span>{selectedPart.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier:</span>
                      <span>{selectedPart.supplier}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Inventory</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock:</span>
                      <span className={selectedPart.quantity <= selectedPart.reorder_level ? 'text-red-600 font-medium' : ''}>
                        {selectedPart.quantity} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reorder Level:</span>
                      <span>{selectedPart.reorder_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{selectedPart.warehouse} - {selectedPart.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Pricing</h4>
                  <PricingDisplay part={selectedPart} />
                  {selectedPart.core_charge && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Core Charge: ${selectedPart.core_charge}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Physical Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedPart.weight && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weight:</span>
                        <span>{selectedPart.weight} lbs</span>
                      </div>
                    )}
                    {selectedPart.dimensions && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span>{selectedPart.dimensions}</span>
                      </div>
                    )}
                    {selectedPart.warranty && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Warranty:</span>
                        <span>{selectedPart.warranty}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Keystone Integration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VCPN:</span>
                      <span className="font-mono">{selectedPart.keystone_vcpn || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Synced:</span>
                      <Badge variant={selectedPart.keystone_synced ? "default" : "secondary"} className="text-xs">
                        {selectedPart.keystone_synced ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {selectedPart.keystone_last_sync && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span>{new Date(selectedPart.keystone_last_sync).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <AddToCartButton 
                part={{
                  id: selectedPart.id,
                  name: selectedPart.name,
                  price: selectedPart.price,
                  quantity: selectedPart.quantity
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => toggleFavorite(selectedPart.id)}
              >
                <Heart className={`h-4 w-4 ${favorites.has(selectedPart.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Parts;

