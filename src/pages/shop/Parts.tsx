import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, X, Minus, Trash2, ArrowRight, DollarSign, TrendingUp, TrendingDown, Truck, MapPin, Clock, Shield, Edit, CheckCircle, Timer, User, CreditCard, FileText, Star, Zap } from "lucide-react";
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

      {/* Other Options */}
      {groupedOptions.others.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Other Options</h5>
          <div className="space-y-2">
            {groupedOptions.others.map((option) => (
              <ShippingOptionCard key={option.id} option={option} />
            ))}
          </div>
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

// Special Orders Component
const SpecialOrdersTab = () => {
  const { items, clearCart, total } = useCart();
  const { toast } = useToast();
  
  // State for checkout process
  const [currentStep, setCurrentStep] = useState(1);
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

  // Place order
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
      const selectedOption = shippingOptions.find(opt => opt.id === selectedShipping);
      
      const orderData = {
        customer,
        shippingAddress,
        items: items.map(item => `${item.id}:${item.quantity}`).join(','),
        shippingMethod: selectedOption?.service || 'Standard',
        specialInstructions: `Cart order - ${items.length} items, Total: $${total.toFixed(2)}`
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

                {/* Step 2: Customer Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Customer Information</h3>
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

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Shipping Method</h4>
                        {selectedShippingOption && (
                          <div className="text-sm">
                            <div className="font-medium">{selectedShippingOption.carrier} {selectedShippingOption.service}</div>
                            <div>Estimated delivery: {new Date(selectedShippingOption.deliveryDate).toLocaleDateString()}</div>
                            <div>Cost: ${selectedShippingOption.cost.toFixed(2)}</div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.name} (Qty: {item.quantity})</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
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
                          `Place Order - $${grandTotal.toFixed(2)}`
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
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({items.length} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {selectedShippingOption && (
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      <span>Estimated delivery: {new Date(selectedShippingOption.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Parts component
const Parts = () => {
  const { toast } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'parts';
  });

  // Parts state
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Mock data for development
  const mockParts: InventoryPart[] = [
    {
      id: "ABC123",
      name: "Brake Pad Set - Front",
      description: "High-performance ceramic brake pads for front wheels",
      sku: "BP-FRONT-001",
      quantity: 25,
      price: 89.99,
      cost: 45.00,
      category: "Brakes",
      supplier: "BrakeTech",
      reorder_level: 10,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-20T14:30:00Z",
      core_charge: 15.00,
      keystone_vcpn: "ABC123",
      keystone_synced: true,
      keystone_last_sync: "2024-01-20T14:30:00Z",
      warehouse: "Main",
      location: "A-15-B",
      brand: "BrakeTech Pro",
      weight: 3.2,
      dimensions: "12x8x2 inches",
      warranty: "2 years",
      list_price: 120.00,
      discount_percentage: 25
    },
    {
      id: "DEF456",
      name: "LED Light Bar 20\"",
      description: "High-intensity LED light bar for off-road vehicles",
      sku: "LED-BAR-20",
      quantity: 15,
      price: 149.95,
      cost: 75.00,
      category: "Lighting",
      supplier: "LightMax",
      reorder_level: 5,
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-18T16:45:00Z",
      core_charge: 0,
      keystone_vcpn: "DEF456",
      keystone_synced: true,
      keystone_last_sync: "2024-01-18T16:45:00Z",
      warehouse: "Main",
      location: "C-22-A",
      brand: "LightMax Pro",
      weight: 2.8,
      dimensions: "20x3x4 inches",
      warranty: "3 years",
      list_price: 199.95,
      discount_percentage: 25
    },
    {
      id: "GHI789",
      name: "Oil Filter - Premium",
      description: "High-efficiency oil filter for extended engine protection",
      sku: "OF-PREM-001",
      quantity: 8,
      price: 24.99,
      cost: 12.50,
      category: "Filters",
      supplier: "FilterPro",
      reorder_level: 15,
      created_at: "2024-01-12T11:00:00Z",
      updated_at: "2024-01-19T09:15:00Z",
      core_charge: 0,
      keystone_vcpn: "GHI789",
      keystone_synced: true,
      keystone_last_sync: "2024-01-19T09:15:00Z",
      warehouse: "Main",
      location: "B-08-C",
      brand: "FilterPro Elite",
      weight: 1.2,
      dimensions: "4x4x6 inches",
      warranty: "1 year",
      list_price: 34.99,
      discount_percentage: 29
    }
  ];

  // Fetch parts data
  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setParts(mockParts);
    } catch (err) {
      setError('Failed to load parts inventory');
      console.error('Error fetching parts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load parts on mount
  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location);
    url.searchParams.set('tab', activeTab);
    window.history.pushState({}, '', url);
  }, [activeTab]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(parts.map(part => part.category).filter(Boolean)));
    return cats.sort();
  }, [parts]);

  // Filter and sort parts
  const filteredParts = useMemo(() => {
    let filtered = parts.filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || part.category === selectedCategory;
      const matchesPrice = part.price >= priceRange[0] && part.price <= priceRange[1];
      const matchesStock = !showInStockOnly || part.quantity > 0;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    // Sort parts
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [parts, searchTerm, selectedCategory, priceRange, sortBy, sortOrder, showInStockOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, priceRange, sortBy, sortOrder, showInStockOnly, itemsPerPage]);

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

  // Open part detail
  const openPartDetail = (part: InventoryPart) => {
    setSelectedPart(part);
    setIsDetailDialogOpen(true);
  };

  // Render part card
  const renderPartCard = (part: InventoryPart) => {
    const isLowStock = part.quantity <= (part.reorder_level || 10);
    const isFavorite = favorites.has(part.id);

    return (
      <Card key={part.id} className="group hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{part.name}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{part.description}</p>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{part.id}</Badge>
                {part.category && <Badge variant="outline" className="text-xs">{part.category}</Badge>}
                {isLowStock && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}
                {part.keystone_synced && <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">Synced</Badge>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(part.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          <div className="space-y-2">
            <PricingDisplay part={part} />
            
            <div className="flex items-center justify-between text-sm">
              <span className={`flex items-center gap-1 ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                <Package className="h-3 w-3" />
                {part.quantity} in stock
              </span>
              {part.warehouse && (
                <span className="text-muted-foreground text-xs">{part.warehouse}</span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <AddToCartButton 
                vcpn={part.keystone_vcpn || part.sku || part.id}
                name={part.name}
                price={part.price}
                sku={part.sku}
                category={part.category}
                inStock={part.quantity > 0}
                maxQuantity={part.quantity}
                weight={part.weight}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => openPartDetail(part)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render part row for list view
  const renderPartRow = (part: InventoryPart) => {
    const isLowStock = part.quantity <= (part.reorder_level || 10);
    const isFavorite = favorites.has(part.id);

    return (
      <TableRow key={part.id} className="group">
        <TableCell className="w-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(part.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="font-medium">{part.name}</div>
            <div className="text-sm text-muted-foreground">{part.id}</div>
            <div className="flex gap-1 flex-wrap">
              {part.category && <Badge variant="outline" className="text-xs">{part.category}</Badge>}
              {isLowStock && <Badge variant="destructive" className="text-xs">Low Stock</Badge>}
              {part.keystone_synced && <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">Synced</Badge>}
            </div>
          </div>
        </TableCell>
        <TableCell>
          {part.category && <Badge variant="outline">{part.category}</Badge>}
        </TableCell>
        <TableCell>
          <PricingDisplay part={part} />
        </TableCell>
        <TableCell>
          <span className={`flex items-center gap-1 ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
            <Package className="h-3 w-3" />
            {part.quantity}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex gap-2">
            <AddToCartButton 
              vcpn={part.keystone_vcpn || part.sku || part.id}
              name={part.name}
              price={part.price}
              sku={part.sku}
              category={part.category}
              inStock={part.quantity > 0}
              maxQuantity={part.quantity}
              weight={part.weight}
              size="sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPartDetail(part)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {pages.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </Button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Parts & Inventory</h1>
          <p className="text-muted-foreground">Manage your parts inventory and place special orders</p>
        </div>
        <CartWidget />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parts">Parts Catalog</TabsTrigger>
          <TabsTrigger value="special-orders" className="relative">
            Special Orders
            <CartWidget showBadgeOnly={true} className="ml-2" />
          </TabsTrigger>
        </TabsList>

        {/* Parts Catalog Tab */}
        <TabsContent value="parts" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div>
                <Label>Search Parts</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, SKU, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div>
                  <Label>Sort By</Label>
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="price-asc">Price Low-High</SelectItem>
                      <SelectItem value="price-desc">Price High-Low</SelectItem>
                      <SelectItem value="quantity-desc">Stock High-Low</SelectItem>
                      <SelectItem value="quantity-asc">Stock Low-High</SelectItem>
                      <SelectItem value="updated-desc">Recently Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div>
                  <Label>View</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="flex-1"
                    >
                      <Grid className="h-4 w-4 mr-1" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex-1"
                    >
                      <List className="h-4 w-4 mr-1" />
                      List
                    </Button>
                  </div>
                </div>

                {/* Items per page */}
                <div>
                  <Label>Items per page</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                      <SelectItem value="96">96</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  step={10}
                  className="mt-2"
                />
              </div>

              {/* Stock Filter */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="stock-filter"
                  checked={showInStockOnly}
                  onCheckedChange={setShowInStockOnly}
                />
                <Label htmlFor="stock-filter">Show in-stock items only</Label>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredParts.length)} of {filteredParts.length} parts
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchParts}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Parts Display */}
          <LoadingWrapper isLoading={loading} message="Loading parts inventory...">
            {filteredParts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No parts found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentParts.map(renderPartCard)}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Part</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentParts.map(renderPartRow)}
                      </TableBody>
                    </Table>
                  </Card>
                )}

                {/* Pagination */}
                {renderPagination()}
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
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPart?.name}</DialogTitle>
            <DialogDescription>
              {selectedPart?.sku} • {selectedPart?.category}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Product Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">SKU:</span> {selectedPart.sku}</div>
                    <div><span className="font-medium">VCPN:</span> {selectedPart.keystone_vcpn}</div>
                    <div><span className="font-medium">Brand:</span> {selectedPart.brand}</div>
                    <div><span className="font-medium">Category:</span> {selectedPart.category}</div>
                    <div><span className="font-medium">Supplier:</span> {selectedPart.supplier}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Inventory</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Quantity:</span> {selectedPart.quantity}</div>
                    <div><span className="font-medium">Reorder Level:</span> {selectedPart.reorder_level}</div>
                    <div><span className="font-medium">Location:</span> {selectedPart.location}</div>
                    <div><span className="font-medium">Warehouse:</span> {selectedPart.warehouse}</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-semibold mb-2">Pricing</h4>
                <PricingDisplay part={selectedPart} />
              </div>

              {/* Description */}
              {selectedPart.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPart.description}</p>
                </div>
              )}

              {/* Specifications */}
              <div>
                <h4 className="font-semibold mb-2">Specifications</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedPart.weight && (
                    <div><span className="font-medium">Weight:</span> {selectedPart.weight} lbs</div>
                  )}
                  {selectedPart.dimensions && (
                    <div><span className="font-medium">Dimensions:</span> {selectedPart.dimensions}</div>
                  )}
                  {selectedPart.warranty && (
                    <div><span className="font-medium">Warranty:</span> {selectedPart.warranty}</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <AddToCartButton
                  vcpn={selectedPart.keystone_vcpn || selectedPart.sku || selectedPart.id}
                  name={selectedPart.name}
                  price={selectedPart.price}
                  sku={selectedPart.sku}
                  category={selectedPart.category}
                  inStock={selectedPart.quantity > 0}
                  maxQuantity={selectedPart.quantity}
                  weight={selectedPart.weight}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(selectedPart.id)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${favorites.has(selectedPart.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  {favorites.has(selectedPart.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Parts;

