import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Package, 
  User, 
  MapPin, 
  Truck, 
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Trash2,
  RefreshCw
} from "lucide-react";

// Import existing services
import { ShippingQuoteService } from '@/services/shipping_quote_service';
import { DropshipOrderService } from '@/services/dropship_order_service';

// Import cart system
import { useCart } from '@/lib/minimal_cart_context';

// Customer interface
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
  name: string;
  price: number;
  estimatedDays: string;
  carrier: string;
}

const SpecialOrders = () => {
  // Cart state
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  
  // Form state
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
    country: 'United States'
  });
  
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [poNumber, setPONumber] = useState('');
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  
  const { toast } = useToast();

  // Calculate totals
  const subtotal = total;
  const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping);
  const shippingCost = selectedShippingOption?.price || 0;
  const tax = subtotal * 0.08; // 8% tax
  const grandTotal = subtotal + shippingCost + tax;

  // Load shipping quotes
  const loadShippingQuotes = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: "Incomplete Address",
        description: "Please fill in all shipping address fields to get quotes.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingShipping(true);
    try {
      const quotes = await ShippingQuoteService.getShippingQuotes({
        items: items.map(item => ({
          vcpn: item.vcpn,
          quantity: item.quantity,
          weight: item.weight || 1
        })),
        shippingAddress: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country
        }
      });

      if (quotes.success && quotes.data) {
        setShippingOptions(quotes.data);
        if (quotes.data.length > 0) {
          setSelectedShipping(quotes.data[0].id);
        }
      } else {
        throw new Error(quotes.error || 'Failed to get shipping quotes');
      }
    } catch (error) {
      console.error('Error loading shipping quotes:', error);
      toast({
        title: "Shipping Quote Error",
        description: "Failed to load shipping options. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!selectedShipping) {
      toast({
        title: "Missing Shipping",
        description: "Please select a shipping option.",
        variant: "destructive",
      });
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        customer,
        shippingAddress,
        items: items.map(item => `${item.vcpn}:${item.quantity}`).join(','),
        shippingMethod: selectedShippingOption?.name || '',
        poNumber,
        specialInstructions,
        subtotal,
        shippingCost,
        tax,
        total: grandTotal
      };

      const result = await DropshipOrderService.placeOrder(orderData);
      
      if (result.success) {
        setOrderResult(result);
        setOrderComplete(true);
        clearCart();
        toast({
          title: "Order Placed Successfully",
          description: `Order ${result.orderNumber} has been submitted.`,
        });
      } else {
        throw new Error(result.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep === 1 && items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 2) {
      if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
        toast({
          title: "Incomplete Information",
          description: "Please fill in all required customer fields.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep === 3) {
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
        toast({
          title: "Incomplete Address",
          description: "Please fill in all shipping address fields.",
          variant: "destructive",
        });
        return;
      }
      loadShippingQuotes();
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Order complete view
  if (orderComplete && orderResult) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order Number:</span>
                  <div>{orderResult.orderNumber}</div>
                </div>
                <div>
                  <span className="font-medium">Total:</span>
                  <div>${grandTotal.toFixed(2)}</div>
                </div>
                <div>
                  <span className="font-medium">Tracking Number:</span>
                  <div>{orderResult.trackingNumber || 'Will be provided when shipped'}</div>
                </div>
                <div>
                  <span className="font-medium">Estimated Delivery:</span>
                  <div>{selectedShippingOption?.estimatedDays || 'TBD'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => {
                setOrderComplete(false);
                setOrderResult(null);
                setCurrentStep(1);
              }} className="flex-1">
                Place Another Order
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Print Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Special Orders</h1>
        <p className="text-muted-foreground">Complete your dropship order with integrated shipping quotes</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: "Cart Review", icon: ShoppingCart },
            { step: 2, title: "Customer Info", icon: User },
            { step: 3, title: "Shipping Address", icon: MapPin },
            { step: 4, title: "Shipping Options", icon: Truck },
            { step: 5, title: "Review & Place Order", icon: CreditCard }
          ].map(({ step, title, icon: Icon }) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs mt-2 text-center">{title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Cart Review */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart Review ({items.length} items)
                </CardTitle>
                <CardDescription>Review your items before proceeding to checkout</CardDescription>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                    <p className="text-sm text-gray-400">Add items from the Parts Catalog to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.vcpn} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">{item.sku} • {item.category}</p>
                          <p className="text-sm font-semibold text-green-600">${item.price.toFixed(2)} each</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.vcpn, Math.max(0, item.quantity - 1))}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.vcpn, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.vcpn)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Customer Information */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                <CardDescription>Enter customer details for the order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={customer.firstName}
                      onChange={(e) => setCustomer({...customer, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={customer.lastName}
                      onChange={(e) => setCustomer({...customer, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({...customer, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={customer.phone}
                      onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={customer.company}
                      onChange={(e) => setCustomer({...customer, company: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Shipping Address */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
                <CardDescription>Where should we ship this order?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select value={shippingAddress.country} onValueChange={(value) => setShippingAddress({...shippingAddress, country: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Shipping Options */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Options
                </CardTitle>
                <CardDescription>Choose your preferred shipping method</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingShipping ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading shipping options...</span>
                  </div>
                ) : shippingOptions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No shipping options available</p>
                    <Button onClick={loadShippingQuotes} className="mt-4">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedShipping === option.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedShipping(option.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{option.name}</h3>
                            <p className="text-sm text-gray-500">{option.carrier} • {option.estimatedDays}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${option.price.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Place Order */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Review & Place Order
                </CardTitle>
                <CardDescription>Review your order details before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Summary */}
                <div>
                  <h3 className="font-medium mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    {items.map((item) => (
                      <div key={item.vcpn} className="flex justify-between">
                        <span>{item.name} (x{item.quantity})</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Customer & Shipping Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Customer</h3>
                    <div className="text-sm text-gray-600">
                      <div>{customer.firstName} {customer.lastName}</div>
                      <div>{customer.email}</div>
                      <div>{customer.phone}</div>
                      {customer.company && <div>{customer.company}</div>}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600">
                      <div>{shippingAddress.street}</div>
                      <div>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</div>
                      <div>{shippingAddress.country}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="poNumber">PO Number (Optional)</Label>
                    <Input
                      id="poNumber"
                      value={poNumber}
                      onChange={(e) => setPONumber(e.target.value)}
                      placeholder="Enter purchase order number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
                    <Textarea
                      id="specialInstructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special delivery instructions or notes"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items):</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                {selectedShippingOption && (
                  <div className="flex justify-between">
                    <span>Shipping ({selectedShippingOption.name}):</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep} className="w-full">
                    Previous Step
                  </Button>
                )}
                
                {currentStep < 5 ? (
                  <Button onClick={nextStep} className="w-full">
                    Continue
                  </Button>
                ) : (
                  <Button 
                    onClick={placeOrder} 
                    className="w-full"
                    disabled={isPlacingOrder || !selectedShipping}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                )}
              </div>

              {currentStep === 4 && shippingOptions.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Complete the shipping address to see shipping options.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SpecialOrders;

