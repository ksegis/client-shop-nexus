import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, X, Minus, Trash2, ArrowRight, DollarSign, TrendingUp, TrendingDown, Truck, MapPin, Clock, Shield, Edit } from "lucide-react";
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

// Import the ProductPriceCheck component
import ProductPriceCheck from '@/components/product_price_check_component';

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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  category?: string;
  inStock: boolean;
  maxQuantity: number;
  vcpn?: string;
  weight?: number;
}

// Shipping interfaces
interface ShippingAddress {
  name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
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

interface ShippingQuoteResponse {
  success: boolean;
  message: string;
  requestId: string;
  timestamp: string;
  shippingOptions: ShippingOption[];
  totalItems: number;
  totalWeight?: number;
  estimatedPackages: number;
  isRateLimited?: boolean;
  nextAllowedTime?: string;
  rateLimitMessage?: string;
}

// Enhanced Shipping Quote Service
class EnhancedShippingQuoteService {
  private static readonly RATE_LIMIT_MINUTES = 5; // 5 minutes between quotes
  private static readonly MAX_ITEMS_PER_REQUEST = 50;
  private static readonly STORAGE_KEY = 'shipping_quote_status';
  
  private isRateLimited: boolean = false;
  private lastQuoteTime: string | null = null;
  private nextAllowedTime: string | null = null;

  constructor() {
    this.loadRateLimitStatus();
  }

  private loadRateLimitStatus(): void {
    try {
      const stored = localStorage.getItem(EnhancedShippingQuoteService.STORAGE_KEY);
      if (stored) {
        const status = JSON.parse(stored);
        this.lastQuoteTime = status.lastQuoteTime;
        this.checkRateLimit();
      }
    } catch (error) {
      console.error('Error loading shipping quote rate limit status:', error);
    }
  }

  private saveRateLimitStatus(): void {
    try {
      const status = {
        lastQuoteTime: this.lastQuoteTime,
        nextAllowedTime: this.nextAllowedTime,
        isRateLimited: this.isRateLimited
      };
      localStorage.setItem(EnhancedShippingQuoteService.STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Error saving shipping quote rate limit status:', error);
    }
  }

  private checkRateLimit(): void {
    if (!this.lastQuoteTime) {
      this.isRateLimited = false;
      this.nextAllowedTime = null;
      return;
    }

    const lastQuote = new Date(this.lastQuoteTime);
    const now = new Date();
    const timeDiff = now.getTime() - lastQuote.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff < EnhancedShippingQuoteService.RATE_LIMIT_MINUTES) {
      this.isRateLimited = true;
      const nextAllowed = new Date(lastQuote.getTime() + (EnhancedShippingQuoteService.RATE_LIMIT_MINUTES * 60 * 1000));
      this.nextAllowedTime = nextAllowed.toISOString();
    } else {
      this.isRateLimited = false;
      this.nextAllowedTime = null;
    }
  }

  public getRateLimitStatus(): { isRateLimited: boolean; nextAllowedTime: string | null; remainingTime: string | null } {
    this.checkRateLimit();
    
    let remainingTime = null;
    if (this.isRateLimited && this.nextAllowedTime) {
      const now = new Date();
      const nextAllowed = new Date(this.nextAllowedTime);
      const timeDiff = nextAllowed.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        remainingTime = `${minutes}m ${seconds}s`;
      }
    }

    return {
      isRateLimited: this.isRateLimited,
      nextAllowedTime: this.nextAllowedTime,
      remainingTime
    };
  }

  public async getShippingQuotes(cartItems: CartItem[], shippingAddress: ShippingAddress): Promise<ShippingQuoteResponse> {
    // Check rate limiting
    this.checkRateLimit();
    if (this.isRateLimited) {
      const status = this.getRateLimitStatus();
      return {
        success: false,
        message: `Rate limited. Next quote allowed in ${status.remainingTime}`,
        requestId: '',
        timestamp: new Date().toISOString(),
        shippingOptions: [],
        totalItems: 0,
        estimatedPackages: 0,
        isRateLimited: true,
        nextAllowedTime: this.nextAllowedTime,
        rateLimitMessage: `Please wait ${status.remainingTime} before requesting another shipping quote.`
      };
    }

    try {
      // Convert cart items to shipping quote format
      const items = cartItems.map(item => ({
        vcpn: item.vcpn || item.sku || item.id,
        quantity: item.quantity,
        weight: item.weight || 1.0 // Default weight if not specified
      }));

      // For development mode, return mock data
      const isDevelopment = import.meta.env.DEV || !import.meta.env.VITE_KEYSTONE_PROXY_URL;
      
      if (isDevelopment) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update rate limiting
        this.lastQuoteTime = new Date().toISOString();
        this.checkRateLimit();
        this.saveRateLimitStatus();

        // Generate mock shipping options
        const mockOptions: ShippingOption[] = [
          {
            carrierId: 'ups',
            carrierName: 'UPS',
            serviceCode: 'ground',
            serviceName: 'Ground',
            cost: 15.99,
            currency: 'USD',
            estimatedDeliveryDays: 3,
            estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            trackingAvailable: true,
            insuranceAvailable: true,
            signatureRequired: false,
            warehouseId: 'main',
            warehouseName: 'Main Warehouse',
            warehouseLocation: 'Los Angeles, CA'
          },
          {
            carrierId: 'fedex',
            carrierName: 'FedEx',
            serviceCode: 'express',
            serviceName: 'Express',
            cost: 28.50,
            currency: 'USD',
            estimatedDeliveryDays: 2,
            estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            trackingAvailable: true,
            insuranceAvailable: true,
            signatureRequired: false,
            warehouseId: 'east',
            warehouseName: 'East Coast Hub',
            warehouseLocation: 'Atlanta, GA'
          },
          {
            carrierId: 'usps',
            carrierName: 'USPS',
            serviceCode: 'priority',
            serviceName: 'Priority Mail',
            cost: 12.75,
            currency: 'USD',
            estimatedDeliveryDays: 2,
            estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            trackingAvailable: true,
            insuranceAvailable: false,
            signatureRequired: false,
            warehouseId: 'main',
            warehouseName: 'Main Warehouse',
            warehouseLocation: 'Los Angeles, CA'
          },
          {
            carrierId: 'ups',
            carrierName: 'UPS',
            serviceCode: 'overnight',
            serviceName: 'Next Day Air',
            cost: 45.99,
            currency: 'USD',
            estimatedDeliveryDays: 1,
            estimatedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            trackingAvailable: true,
            insuranceAvailable: true,
            signatureRequired: true,
            warehouseId: 'main',
            warehouseName: 'Main Warehouse',
            warehouseLocation: 'Los Angeles, CA'
          }
        ];

        return {
          success: true,
          message: 'Shipping quotes retrieved successfully (mock data)',
          requestId: `mock-${Date.now()}`,
          timestamp: new Date().toISOString(),
          shippingOptions: mockOptions,
          totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          totalWeight: cartItems.reduce((sum, item) => sum + (item.weight || 1.0) * item.quantity, 0),
          estimatedPackages: Math.ceil(cartItems.length / 5) // Estimate 5 items per package
        };
      }

      // Production API call would go here
      // For now, return mock data even in production
      return {
        success: false,
        message: 'Production shipping quotes not yet implemented',
        requestId: '',
        timestamp: new Date().toISOString(),
        shippingOptions: [],
        totalItems: 0,
        estimatedPackages: 0
      };

    } catch (error) {
      console.error('Error getting shipping quotes:', error);
      return {
        success: false,
        message: `Error getting shipping quotes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        requestId: '',
        timestamp: new Date().toISOString(),
        shippingOptions: [],
        totalItems: 0,
        estimatedPackages: 0
      };
    }
  }

  public clearRateLimit(): void {
    this.isRateLimited = false;
    this.lastQuoteTime = null;
    this.nextAllowedTime = null;
    localStorage.removeItem(EnhancedShippingQuoteService.STORAGE_KEY);
  }
}

// Enhanced pricing display component with ProductPriceCheck integration
const PricingDisplay: React.FC<{
  part: InventoryPart;
}> = ({ part }) => {
  // If part has a VCPN, use the ProductPriceCheck component
  if (part.keystone_vcpn) {
    return (
      <ProductPriceCheck
        vcpn={part.keystone_vcpn}
        listPrice={part.list_price || part.price}
        productName={part.name}
        showComparison={true}
        autoCheck={false}
        className="border-0 shadow-none p-0"
      />
    );
  }
  
  // Fallback for parts without VCPN - use original pricing display
  const discountPercentage = part.list_price && part.price 
    ? Math.round(((part.list_price - part.price) / part.list_price) * 100)
    : 0;

  return (
    <div className="space-y-2">
      {/* Main price display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-green-600">
            ${part.price?.toFixed(2) || '0.00'}
          </span>
          {part.list_price && part.list_price > part.price && (
            <span className="text-sm text-gray-500 line-through">
              ${part.list_price.toFixed(2)}
            </span>
          )}
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
      </div>

      {/* Additional pricing info */}
      {(part.core_charge || part.cost) && (
        <div className="flex space-x-4 text-sm text-gray-600">
          {part.core_charge && part.core_charge > 0 && (
            <span>Core: ${part.core_charge.toFixed(2)}</span>
          )}
          {part.cost && (
            <span>Cost: ${part.cost.toFixed(2)}</span>
          )}
        </div>
      )}

      {/* Pricing status indicator */}
      <div className="flex items-center space-x-2 text-xs">
        <DollarSign className="h-3 w-3 text-gray-400" />
        <span className="text-gray-500">
          {part.keystone_vcpn ? 'Live pricing available' : 'Standard pricing'}
        </span>
      </div>
    </div>
  );
};

// Simple loading wrapper component
const LoadingWrapper: React.FC<{ 
  isLoading: boolean; 
  hasData: boolean; 
  children: React.ReactNode;
  loadingMessage?: string;
}> = ({ isLoading, hasData, children, loadingMessage = "Loading..." }) => {
  if (isLoading && !hasData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">{loadingMessage}</p>
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
};

// Enhanced Cart Drawer Component with Shipping Quotes
const EnhancedCartDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cart: { [key: string]: number };
  parts: InventoryPart[];
  onUpdateQuantity: (partId: string, quantity: number) => void;
  onRemoveItem: (partId: string) => void;
  onClearCart: () => void;
}> = ({ isOpen, onClose, cart, parts, onUpdateQuantity, onRemoveItem, onClearCart }) => {
  const { toast } = useToast();
  
  // State for shipping functionality
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [isGettingQuotes, setIsGettingQuotes] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingQuoteService] = useState(() => new EnhancedShippingQuoteService());
  const [rateLimitStatus, setRateLimitStatus] = useState(shippingQuoteService.getRateLimitStatus());

  // Convert cart object to cart items with part details
  const cartItems: CartItem[] = Object.entries(cart).map(([partId, quantity]) => {
    const part = parts.find(p => p.id === partId);
    return {
      id: partId,
      name: part?.name || 'Unknown Part',
      price: part?.price || 0,
      quantity,
      sku: part?.sku || part?.keystone_vcpn,
      category: part?.category,
      inStock: (part?.quantity || 0) > 0,
      maxQuantity: part?.quantity || 0,
      vcpn: part?.keystone_vcpn,
      weight: part?.weight || 1.0
    };
  }).filter(item => item.quantity > 0);

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const shippingCost = selectedShippingOption ? selectedShippingOption.cost : (subtotal > 100 ? 0 : 15);
  const total = subtotal + tax + shippingCost;
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Update rate limit status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitStatus(shippingQuoteService.getRateLimitStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, [shippingQuoteService]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle quantity updates
  const handleQuantityChange = (partId: string, newQuantity: number) => {
    const item = cartItems.find(item => item.id === partId);
    if (!item) return;

    if (newQuantity <= 0) {
      onRemoveItem(partId);
      toast({
        title: "Item Removed",
        description: `${item.name} removed from cart`,
        variant: "default",
      });
    } else if (newQuantity > item.maxQuantity) {
      toast({
        title: "Stock Limit",
        description: `Only ${item.maxQuantity} available in stock`,
        variant: "destructive",
      });
    } else {
      onUpdateQuantity(partId, newQuantity);
    }
  };

  // Handle shipping address changes
  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get shipping quotes
  const handleGetShippingQuotes = async () => {
    if (!shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: "Address Required",
        description: "Please fill in all required address fields",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before getting shipping quotes",
        variant: "destructive",
      });
      return;
    }

    setIsGettingQuotes(true);
    try {
      const response = await shippingQuoteService.getShippingQuotes(cartItems, shippingAddress);
      
      if (response.success) {
        setShippingOptions(response.shippingOptions);
        setSelectedShippingOption(null); // Reset selection
        toast({
          title: "Shipping Quotes Retrieved",
          description: `Found ${response.shippingOptions.length} shipping options`,
          variant: "default",
        });
      } else {
        if (response.isRateLimited) {
          toast({
            title: "Rate Limited",
            description: response.rateLimitMessage || "Please wait before requesting another quote",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Quote Error",
            description: response.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get shipping quotes",
        variant: "destructive",
      });
    } finally {
      setIsGettingQuotes(false);
      setRateLimitStatus(shippingQuoteService.getRateLimitStatus());
    }
  };

  // Select shipping option
  const handleSelectShippingOption = (option: ShippingOption) => {
    setSelectedShippingOption(option);
    toast({
      title: "Shipping Selected",
      description: `${option.carrierName} ${option.serviceName} - $${option.cost.toFixed(2)}`,
      variant: "default",
    });
  };

  // Check if address is complete
  const isAddressComplete = shippingAddress.address1 && shippingAddress.city && shippingAddress.state && shippingAddress.zipCode;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="ml-auto relative bg-white w-full max-w-md h-full shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Shopping Cart</h2>
              {totalItems > 0 && (
                <Badge variant="secondary">{totalItems} items</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            {/* Cart Items */}
            <ScrollArea className="flex-1 p-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <Button variant="outline" onClick={onClose} className="mt-4">
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {/* Placeholder for item image */}
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{item.name}</h3>
                            {item.sku && (
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            )}
                            {item.category && (
                              <p className="text-xs text-gray-500">{item.category}</p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-semibold text-green-600">
                                ${item.price.toFixed(2)}
                              </span>
                              
                              {/* Quantity controls */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <span className="w-8 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  disabled={item.quantity >= item.maxQuantity}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onRemoveItem(item.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Stock status */}
                            <div className="mt-1">
                              {item.inStock ? (
                                <span className="text-xs text-green-600">
                                  {item.maxQuantity} in stock
                                </span>
                              ) : (
                                <span className="text-xs text-red-600">Out of stock</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Shipping Address Section */}
                  {cartItems.length > 0 && (
                    <Card className="mt-6">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <CardTitle className="text-sm">Shipping Address</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowShippingForm(!showShippingForm)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      {showShippingForm && (
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="address1" className="text-xs">Address *</Label>
                              <Input
                                id="address1"
                                placeholder="123 Main St"
                                value={shippingAddress.address1}
                                onChange={(e) => handleAddressChange('address1', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor="address2" className="text-xs">Apt/Suite</Label>
                              <Input
                                id="address2"
                                placeholder="Apt 1"
                                value={shippingAddress.address2 || ''}
                                onChange={(e) => handleAddressChange('address2', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="city" className="text-xs">City *</Label>
                              <Input
                                id="city"
                                placeholder="Los Angeles"
                                value={shippingAddress.city}
                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor="state" className="text-xs">State *</Label>
                              <Input
                                id="state"
                                placeholder="CA"
                                value={shippingAddress.state}
                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="zipCode" className="text-xs">ZIP Code *</Label>
                              <Input
                                id="zipCode"
                                placeholder="90210"
                                value={shippingAddress.zipCode}
                                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div>
                              <Label htmlFor="country" className="text-xs">Country</Label>
                              <Select value={shippingAddress.country} onValueChange={(value) => handleAddressChange('country', value)}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="US">United States</SelectItem>
                                  <SelectItem value="CA">Canada</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Get Shipping Quotes Button */}
                          <div className="pt-2">
                            <Button
                              onClick={handleGetShippingQuotes}
                              disabled={!isAddressComplete || isGettingQuotes || rateLimitStatus.isRateLimited}
                              className="w-full h-8 text-xs"
                              size="sm"
                            >
                              {isGettingQuotes ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Getting Quotes...
                                </>
                              ) : rateLimitStatus.isRateLimited ? (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Rate Limited ({rateLimitStatus.remainingTime})
                                </>
                              ) : (
                                <>
                                  <Truck className="h-3 w-3 mr-1" />
                                  Get Shipping Quotes
                                </>
                              )}
                            </Button>
                            
                            {rateLimitStatus.isRateLimited && (
                              <p className="text-xs text-orange-600 mt-1 text-center">
                                Next quote allowed in {rateLimitStatus.remainingTime}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )}

                  {/* Shipping Options */}
                  {shippingOptions.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4" />
                          <CardTitle className="text-sm">Shipping Options</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {shippingOptions.map((option, index) => (
                          <div
                            key={index}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedShippingOption === option
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleSelectShippingOption(option)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">
                                    {option.carrierName} - {option.serviceName}
                                  </span>
                                  {option.trackingAvailable && (
                                    <Badge variant="outline" className="text-xs">
                                      <Package className="h-2 w-2 mr-1" />
                                      Tracking
                                    </Badge>
                                  )}
                                  {option.signatureRequired && (
                                    <Badge variant="outline" className="text-xs">
                                      <Shield className="h-2 w-2 mr-1" />
                                      Signature
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                  {option.estimatedDeliveryDays} days delivery • From: {option.warehouseLocation}
                                </p>
                                {option.estimatedDeliveryDate && (
                                  <p className="text-xs text-gray-500">
                                    Est. delivery: {new Date(option.estimatedDeliveryDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-sm">
                                  ${option.cost.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Footer with totals and checkout */}
            {cartItems.length > 0 && (
              <div className="border-t p-4 space-y-4">
                {/* Price breakdown */}
                <div className="space-y-2 text-sm">
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
                    <span>
                      {selectedShippingOption ? (
                        <div className="text-right">
                          <div>${selectedShippingOption.cost.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {selectedShippingOption.carrierName} {selectedShippingOption.serviceName}
                          </div>
                        </div>
                      ) : shippingCost === 0 ? (
                        'FREE'
                      ) : (
                        `$${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {!selectedShippingOption && shippingCost === 0 && (
                    <p className="text-xs text-green-600">🎉 Free shipping on orders over $100!</p>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <Button className="w-full" size="lg">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      Continue Shopping
                    </Button>
                    <Button variant="ghost" onClick={onClearCart} className="flex-1">
                      Clear Cart
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Parts component - complete version with all existing functionality
const PartsPage: React.FC = () => {
  // State management
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Cart state
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { toast } = useToast();

  // Simplified data loading - you can replace this with your actual data source
  const loadInventoryData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Try to load from cache first
      const cachedData = localStorage.getItem('inventory_cache');
      if (cachedData) {
        console.log('📦 Loading from cache...');
        const parsedData = JSON.parse(cachedData);
        setParts(parsedData);
        setIsLoading(false);
        return;
      }

      // If no cache, you can add your actual data loading logic here
      // For now, we'll use mock data to prevent errors
      console.log('📊 Loading inventory data...');
      
      // Mock data for demonstration - replace with your actual data loading
      const mockParts: InventoryPart[] = [
        {
          id: '1',
          name: 'Sample Part 1',
          description: 'This is a sample part for testing',
          sku: 'SAMPLE-001',
          quantity: 10,
          price: 25.99,
          category: 'Electronics',
          keystone_vcpn: 'TEST-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          list_price: 29.99,
          weight: 2.5
        },
        {
          id: '2',
          name: 'Sample Part 2',
          description: 'Another sample part',
          sku: 'SAMPLE-002',
          quantity: 5,
          price: 15.50,
          category: 'Hardware',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          weight: 1.2
        },
        {
          id: '3',
          name: 'Premium Component',
          description: 'High-quality premium component with Keystone integration',
          sku: 'PREM-003',
          quantity: 8,
          price: 45.99,
          category: 'Electronics',
          keystone_vcpn: 'TEST-003',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          list_price: 52.99,
          weight: 3.1
        }
      ];

      setParts(mockParts);
      
      // Cache the data
      localStorage.setItem('inventory_cache', JSON.stringify(mockParts));
      localStorage.setItem('inventory_cache_timestamp', new Date().toISOString());

    } catch (error) {
      console.error('❌ Failed to load inventory data:', error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load inventory data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial data load
  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  // Cart functions
  const addToCart = (partId: string, quantity: number = 1) => {
    console.log('🛒 Adding to cart:', partId, 'quantity:', quantity);
    
    setCart(prev => {
      const newCart = {
        ...prev,
        [partId]: (prev[partId] || 0) + quantity
      };
      console.log('🛒 Updated cart state:', newCart);
      return newCart;
    });
    
    const part = parts.find(p => p.id === partId);
    if (part) {
      toast({
        title: "Added to Cart",
        description: `${part.name} added to cart`,
        variant: "default",
      });
    }
  };

  const updateCartQuantity = (partId: string, quantity: number) => {
    setCart(prev => ({
      ...prev,
      [partId]: quantity
    }));
  };

  const removeFromCart = (partId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[partId];
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart",
      variant: "default",
    });
  };

  // Calculate cart totals
  const cartItemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartTotalValue = Object.entries(cart).reduce((total, [partId, quantity]) => {
    const part = parts.find(p => p.id === partId);
    return total + (part?.price || 0) * quantity;
  }, 0);

  // Filter and sort parts
  useEffect(() => {
    let filtered = parts.filter(part => {
      const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           part.keystone_vcpn?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || part.category === selectedCategory;
      const matchesPrice = part.price >= priceRange[0] && part.price <= priceRange[1];
      const matchesStock = !showInStockOnly || part.quantity > 0;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });

    // Sort parts
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        case 'updated':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredParts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [parts, searchTerm, selectedCategory, priceRange, showInStockOnly, sortBy, sortOrder]);

  // Get unique categories
  const categories = Array.from(new Set(parts.map(part => part.category).filter(Boolean)));

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  // Handle part detail view
  const handlePartClick = (part: InventoryPart) => {
    setSelectedPart(part);
    setIsPartDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parts Inventory</h1>
          <p className="text-gray-600">
            {isLoading ? 'Loading parts inventory...' : 
             `Database • ${filteredParts.length} of ${parts.length} parts`}
          </p>
        </div>
        
        {/* Cart Button */}
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => {
              console.log('🛒 Cart clicked. Current cart:', cart);
              console.log('🛒 Total items:', cartItemCount);
              console.log('🛒 Total value:', cartTotalValue);
              setIsCartOpen(true);
            }}
            className="relative"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Cart ({cartItemCount})
            {cartItemCount > 0 && (
              <>
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {cartItemCount}
                </Badge>
                <span className="ml-2 text-green-200">
                  ${cartTotalValue.toFixed(2)}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category!}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="price-asc">Price Low-High</SelectItem>
                <SelectItem value="price-desc">Price High-Low</SelectItem>
                <SelectItem value="quantity-desc">Stock High-Low</SelectItem>
                <SelectItem value="updated-desc">Recently Updated</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
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
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </Label>
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              max={1000}
              min={0}
              step={10}
              className="w-full"
            />
          </div>

          {/* Stock Filter */}
          <div className="flex items-center space-x-2">
            <Switch
              id="in-stock-only"
              checked={showInStockOnly}
              onCheckedChange={setShowInStockOnly}
            />
            <Label htmlFor="in-stock-only">Show in-stock items only</Label>
          </div>
        </CardContent>
      </Card>

      {/* Parts Display */}
      <LoadingWrapper 
        isLoading={isLoading} 
        hasData={parts.length > 0}
        loadingMessage="Loading parts inventory..."
      >
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setPriceRange([0, 1000]);
                  setShowInStockOnly(false);
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Parts Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {currentParts.map((part) => (
                  <Card key={part.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      {/* Part Image Placeholder */}
                      <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>

                      {/* Part Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 
                            className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-blue-600"
                            onClick={() => handlePartClick(part)}
                          >
                            {part.name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFavorites = new Set(favorites);
                              if (newFavorites.has(part.id)) {
                                newFavorites.delete(part.id);
                              } else {
                                newFavorites.add(part.id);
                              }
                              setFavorites(newFavorites);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Heart 
                              className={`h-4 w-4 ${
                                favorites.has(part.id) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} 
                            />
                          </Button>
                        </div>

                        {/* SKU and Category */}
                        <div className="flex flex-wrap gap-1">
                          {part.sku && (
                            <Badge variant="outline" className="text-xs">
                              {part.sku}
                            </Badge>
                          )}
                          {part.category && (
                            <Badge variant="secondary" className="text-xs">
                              {part.category}
                            </Badge>
                          )}
                        </div>

                        {/* INTEGRATED PRODUCTPRICECHECK COMPONENT */}
                        <PricingDisplay part={part} />

                        {/* Stock Status */}
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${
                            part.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'}
                          </span>
                          {part.reorder_level && part.quantity <= part.reorder_level && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <Button
                            onClick={() => addToCart(part.id)}
                            disabled={part.quantity === 0}
                            className="flex-1"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePartClick(part)}
                            className="px-3"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <h3 
                                className="font-medium cursor-pointer hover:text-blue-600"
                                onClick={() => handlePartClick(part)}
                              >
                                {part.name}
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {part.sku && (
                                  <Badge variant="outline" className="text-xs">
                                    {part.sku}
                                  </Badge>
                                )}
                                {part.keystone_vcpn && (
                                  <Badge variant="secondary" className="text-xs">
                                    {part.keystone_vcpn}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {part.category && (
                            <Badge variant="secondary">
                              {part.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* INTEGRATED PRODUCTPRICECHECK COMPONENT */}
                          <PricingDisplay part={part} />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={`font-medium ${
                              part.quantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'}
                            </span>
                            {part.reorder_level && part.quantity <= part.reorder_level && (
                              <Badge variant="destructive" className="text-xs">
                                Low Stock
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => addToCart(part.id)}
                              disabled={part.quantity === 0}
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePartClick(part)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFavorites = new Set(favorites);
                                if (newFavorites.has(part.id)) {
                                  newFavorites.delete(part.id);
                                } else {
                                  newFavorites.add(part.id);
                                }
                                setFavorites(newFavorites);
                              }}
                            >
                              <Heart 
                                className={`h-4 w-4 ${
                                  favorites.has(part.id) 
                                    ? 'fill-red-500 text-red-500' 
                                    : 'text-gray-400'
                                }`} 
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredParts.length)} of {filteredParts.length} results
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </LoadingWrapper>

      {/* Part Detail Dialog */}
      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPart?.name}</DialogTitle>
            <DialogDescription>
              Part details and specifications
            </DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <div className="space-y-6">
              {/* Part Image */}
              <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">SKU</Label>
                  <p className="text-sm">{selectedPart.sku || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <p className="text-sm">{selectedPart.category || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Supplier</Label>
                  <p className="text-sm">{selectedPart.supplier || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Brand</Label>
                  <p className="text-sm">{selectedPart.brand || 'N/A'}</p>
                </div>
              </div>

              {/* INTEGRATED PRODUCTPRICECHECK COMPONENT IN DIALOG */}
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">Live Pricing Information</Label>
                <PricingDisplay part={selectedPart} />
              </div>

              {/* Description */}
              {selectedPart.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-sm mt-1">{selectedPart.description}</p>
                </div>
              )}

              {/* Stock Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Stock</Label>
                  <p className={`text-sm font-medium ${
                    selectedPart.quantity > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedPart.quantity} units
                  </p>
                </div>
                {selectedPart.reorder_level && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Reorder Level</Label>
                    <p className="text-sm">{selectedPart.reorder_level} units</p>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              {(selectedPart.weight || selectedPart.dimensions || selectedPart.warranty) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedPart.weight && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Weight</Label>
                      <p className="text-sm">{selectedPart.weight} lbs</p>
                    </div>
                  )}
                  {selectedPart.dimensions && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Dimensions</Label>
                      <p className="text-sm">{selectedPart.dimensions}</p>
                    </div>
                  )}
                  {selectedPart.warranty && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Warranty</Label>
                      <p className="text-sm">{selectedPart.warranty}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sync Information */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-500 mb-2 block">Sync Information</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <p>{new Date(selectedPart.updated_at).toLocaleString()}</p>
                  </div>
                  {selectedPart.keystone_last_sync && (
                    <div>
                      <span className="text-gray-500">Last Keystone Sync:</span>
                      <p>{new Date(selectedPart.keystone_last_sync).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedPart.keystone_vcpn && (
                    <div>
                      <span className="text-gray-500">Keystone VCPN:</span>
                      <p>{selectedPart.keystone_vcpn}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={() => {
                    addToCart(selectedPart.id);
                    setIsPartDialogOpen(false);
                  }}
                  disabled={selectedPart.quantity === 0}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newFavorites = new Set(favorites);
                    if (newFavorites.has(selectedPart.id)) {
                      newFavorites.delete(selectedPart.id);
                    } else {
                      newFavorites.add(selectedPart.id);
                    }
                    setFavorites(newFavorites);
                  }}
                  className="flex-1"
                >
                  <Heart 
                    className={`h-4 w-4 mr-2 ${
                      favorites.has(selectedPart.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400'
                    }`} 
                  />
                  {favorites.has(selectedPart.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Cart Drawer with Shipping Quotes */}
      <EnhancedCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        parts={parts}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default PartsPage;

