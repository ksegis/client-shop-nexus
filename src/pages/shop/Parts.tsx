import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Package, ShoppingCart, Search, Plus, Grid, List, Heart, Eye, RefreshCw, X, Minus, Trash2, ArrowRight, DollarSign, TrendingUp, TrendingDown, Truck, MapPin, Clock, Shield, Edit, CheckCircle, Timer } from "lucide-react";
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
  estimatedDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
}

// Enhanced Cart Drawer Component with Fixed Development Mode and Persistence
const EnhancedCartDrawer = ({ 
  isOpen, 
  onClose, 
  cart, 
  parts, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart 
}) => {
  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState({
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  // Shipping quotes state
  const [shippingQuotes, setShippingQuotes] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);
  const [lastQuoteTime, setLastQuoteTime] = useState(null);

  // Environment detection
  const [environment, setEnvironment] = useState('development');

  // Load saved data on mount
  useEffect(() => {
    loadSavedShippingAddress();
    loadEnvironment();
    loadLastQuoteTime();
  }, []);

  // Save shipping address when it changes
  useEffect(() => {
    saveShippingAddress();
  }, [shippingAddress]);

  const loadEnvironment = () => {
    try {
      const saved = localStorage.getItem('admin_environment');
      setEnvironment(saved || 'development');
    } catch (error) {
      console.error('Error loading environment:', error);
      setEnvironment('development');
    }
  };

  const loadSavedShippingAddress = () => {
    try {
      const saved = localStorage.getItem('cart_shipping_address');
      if (saved) {
        const address = JSON.parse(saved);
        setShippingAddress(address);
      }
    } catch (error) {
      console.error('Error loading shipping address:', error);
    }
  };

  const saveShippingAddress = () => {
    try {
      localStorage.setItem('cart_shipping_address', JSON.stringify(shippingAddress));
    } catch (error) {
      console.error('Error saving shipping address:', error);
    }
  };

  const loadLastQuoteTime = () => {
    try {
      const saved = localStorage.getItem('cart_last_quote_time');
      if (saved) {
        setLastQuoteTime(parseInt(saved));
      }
    } catch (error) {
      console.error('Error loading last quote time:', error);
    }
  };

  const saveLastQuoteTime = (time) => {
    try {
      localStorage.setItem('cart_last_quote_time', time.toString());
      setLastQuoteTime(time);
    } catch (error) {
      console.error('Error saving last quote time:', error);
    }
  };

  // Check if we can get shipping quotes (rate limiting)
  const canGetShippingQuotes = () => {
    if (!lastQuoteTime) return true;
    
    const now = new Date().getTime();
    const timeSinceLastQuote = now - lastQuoteTime;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return timeSinceLastQuote >= fiveMinutes;
  };

  const getTimeUntilNextQuote = () => {
    if (!lastQuoteTime) return 0;
    
    const now = new Date().getTime();
    const timeSinceLastQuote = now - lastQuoteTime;
    const fiveMinutes = 5 * 60 * 1000;
    const timeRemaining = fiveMinutes - timeSinceLastQuote;
    
    return Math.max(0, Math.ceil(timeRemaining / 1000));
  };

  // Generate mock shipping quotes for development
  const generateMockShippingQuotes = () => {
    const mockQuotes = [
      {
        id: 'ups_ground',
        carrierId: 'ups',
        carrierName: 'UPS',
        serviceCode: 'ground',
        serviceName: 'Ground',
        cost: 12.99,
        currency: 'USD',
        estimatedDeliveryDays: 3,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        warehouseId: 'sac_01',
        warehouseName: 'Sacramento Warehouse',
        warehouseLocation: 'Sacramento, CA',
        trackingAvailable: true,
        insuranceAvailable: true,
        signatureRequired: false
      },
      {
        id: 'fedex_ground',
        carrierId: 'fedex',
        carrierName: 'FedEx',
        serviceCode: 'ground',
        serviceName: 'Ground',
        cost: 13.49,
        currency: 'USD',
        estimatedDeliveryDays: 3,
        estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        warehouseId: 'sac_01',
        warehouseName: 'Sacramento Warehouse',
        warehouseLocation: 'Sacramento, CA',
        trackingAvailable: true,
        insuranceAvailable: true,
        signatureRequired: false
      },
      {
        id: 'ups_2day',
        carrierId: 'ups',
        carrierName: 'UPS',
        serviceCode: '2day',
        serviceName: '2nd Day Air',
        cost: 24.99,
        currency: 'USD',
        estimatedDeliveryDays: 2,
        estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        warehouseId: 'sac_01',
        warehouseName: 'Sacramento Warehouse',
        warehouseLocation: 'Sacramento, CA',
        trackingAvailable: true,
        insuranceAvailable: true,
        signatureRequired: false
      },
      {
        id: 'fedex_overnight',
        carrierId: 'fedex',
        carrierName: 'FedEx',
        serviceCode: 'overnight',
        serviceName: 'Priority Overnight',
        cost: 39.99,
        currency: 'USD',
        estimatedDeliveryDays: 1,
        estimatedDeliveryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        warehouseId: 'sac_01',
        warehouseName: 'Sacramento Warehouse',
        warehouseLocation: 'Sacramento, CA',
        trackingAvailable: true,
        insuranceAvailable: true,
        signatureRequired: true
      },
      {
        id: 'usps_priority',
        carrierId: 'usps',
        carrierName: 'USPS',
        serviceCode: 'priority',
        serviceName: 'Priority Mail',
        cost: 8.99,
        currency: 'USD',
        estimatedDeliveryDays: 2,
        estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        warehouseId: 'sac_01',
        warehouseName: 'Sacramento Warehouse',
        warehouseLocation: 'Sacramento, CA',
        trackingAvailable: true,
        insuranceAvailable: false,
        signatureRequired: false
      }
    ];

    return mockQuotes;
  };

  // Handle getting shipping quotes
  const handleGetShippingQuotes = async () => {
    // Validate address
    if (!shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      setShippingError('Please fill in all required address fields');
      return;
    }

    // Check rate limiting
    if (!canGetShippingQuotes()) {
      const timeRemaining = getTimeUntilNextQuote();
      setShippingError(`Rate limited. Please wait ${Math.ceil(timeRemaining / 60)} more minutes.`);
      return;
    }

    setShippingLoading(true);
    setShippingError(null);
    setShippingQuotes([]);
    setSelectedShipping(null);

    try {
      if (environment === 'development') {
        // Use mock data in development
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        const mockQuotes = generateMockShippingQuotes();
        setShippingQuotes(mockQuotes);
        saveLastQuoteTime(new Date().getTime());
        
        // Auto-select the cheapest option
        const cheapest = mockQuotes.reduce((prev, current) => 
          prev.cost < current.cost ? prev : current
        );
        setSelectedShipping(cheapest);
      } else {
        // Production mode - show not implemented error
        setShippingError('Production shipping quotes not yet implemented. Please use development mode for testing.');
      }
    } catch (error) {
      console.error('Shipping quote error:', error);
      setShippingError('Failed to get shipping quotes. Please try again.');
    } finally {
      setShippingLoading(false);
    }
  };

  // Calculate cart totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((total, item) => {
      const part = parts.find(p => p.id === item.id);
      return total + (part?.price || 0) * item.quantity;
    }, 0);

    const tax = subtotal * 0.08; // 8% tax
    const shippingCost = selectedShipping ? selectedShipping.cost : 0;
    const total = subtotal + tax + shippingCost;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shippingCost.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const totals = calculateTotals();

  // Check if address is complete
  const isAddressComplete = shippingAddress.address1 && 
                           shippingAddress.city && 
                           shippingAddress.state && 
                           shippingAddress.zipCode;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Shopping Cart</h2>
              <Badge variant="secondary">{cart.length} items</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-3">
                  {cart.map((item) => {
                    const part = parts.find(p => p.id === item.id);
                    if (!part) return null;

                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{part.name}</h3>
                          <p className="text-xs text-gray-500">{part.sku}</p>
                          <p className="text-sm font-semibold text-green-600">${part.price}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
                    );
                  })}
                </div>

                <Separator />

                {/* Shipping Address */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <Label className="text-sm font-medium">Shipping Address</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Address *"
                        value={shippingAddress.address1}
                        onChange={(e) => setShippingAddress({...shippingAddress, address1: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="City *"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="State *"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="ZIP Code *"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <select
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>
                  </div>

                  {/* Get Shipping Quotes Button */}
                  <Button
                    onClick={handleGetShippingQuotes}
                    disabled={shippingLoading || !isAddressComplete || !canGetShippingQuotes()}
                    className="w-full"
                  >
                    {shippingLoading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Getting Quotes...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4 mr-2" />
                        Get Shipping Quotes
                      </>
                    )}
                  </Button>

                  {/* Rate Limit Warning */}
                  {!canGetShippingQuotes() && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <Timer className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 text-sm">
                        Rate limited. Next quote available in {Math.ceil(getTimeUntilNextQuote() / 60)} minutes.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Environment Notice */}
                  {environment === 'development' && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-sm">
                        Development mode: Using mock shipping data
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Shipping Error */}
                  {shippingError && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 text-sm">
                        {shippingError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Shipping Options */}
                {shippingQuotes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <Label className="text-sm font-medium">Shipping Options</Label>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {shippingQuotes.map((quote) => (
                        <div
                          key={quote.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedShipping?.id === quote.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedShipping(quote)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{quote.carrierName} - {quote.serviceName}</p>
                                {selectedShipping?.id === quote.id && (
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                <span>{quote.estimatedDeliveryDays} days delivery</span>
                                <span> • From: {quote.warehouseName}</span>
                                {quote.trackingAvailable && <span> • Tracking available</span>}
                                {quote.signatureRequired && <span> • Signature required</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-sm">
                                ${quote.cost}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(quote.estimatedDeliveryDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${totals.tax}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>
                      {selectedShipping ? `$${totals.shipping}` : 'TBD'}
                    </span>
                  </div>
                  {selectedShipping && (
                    <div className="text-xs text-gray-500">
                      {selectedShipping.carrierName} - {selectedShipping.serviceName}
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${totals.total}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-2">
              <Button 
                className="w-full" 
                size="lg"
                disabled={!selectedShipping}
              >
                Proceed to Checkout
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onClearCart}
              >
                Clear Cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

// Main Parts component
const Parts = () => {
  // State management
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<InventoryPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { toast } = useToast();

  // Cache management
  const CACHE_KEY = 'parts_inventory_cache';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load cached data
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return null;
  }, []);

  // Save to cache
  const saveToCache = useCallback((data: InventoryPart[]) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, []);

  // Load favorites from localStorage
  const loadFavorites = useCallback(() => {
    try {
      const saved = localStorage.getItem('parts_favorites');
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    try {
      localStorage.setItem('parts_favorites', JSON.stringify([...newFavorites]));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, []);

  // Load cart from localStorage
  const loadCart = useCallback(() => {
    try {
      const saved = localStorage.getItem('parts_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // Save cart to localStorage
  const saveCart = useCallback((newCart: CartItem[]) => {
    try {
      localStorage.setItem('parts_cart', JSON.stringify(newCart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, []);

  // Mock data for development
  const getMockData = useCallback((): InventoryPart[] => {
    return [
      {
        id: '1',
        name: 'LED Light Bar 20"',
        description: 'High-performance LED light bar with flood and spot beam pattern',
        sku: 'KS-82015',
        quantity: 15,
        price: 149.95,
        cost: 89.97,
        category: 'Lighting',
        supplier: 'Keystone Automotive',
        reorder_level: 5,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z',
        keystone_vcpn: 'KS-82015',
        keystone_synced: true,
        keystone_last_sync: '2024-01-20T14:30:00Z',
        warehouse: 'Main',
        location: 'A1-B2',
        brand: 'ProLight',
        weight: 3.2,
        dimensions: '20" x 3" x 4"',
        warranty: '2 years',
        list_price: 199.95,
        discount_percentage: 25
      },
      {
        id: '2',
        name: 'Black Led Bull Bar Toyota',
        description: 'Heavy-duty black LED bull bar designed for Toyota trucks',
        sku: 'B-74060',
        quantity: 8,
        price: 299.95,
        cost: 179.97,
        category: 'Protection',
        supplier: 'Keystone Automotive',
        reorder_level: 3,
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-18T16:45:00Z',
        keystone_vcpn: 'B-74060',
        keystone_synced: true,
        keystone_last_sync: '2024-01-18T16:45:00Z',
        warehouse: 'Main',
        location: 'C3-D4',
        brand: 'BullGuard',
        weight: 45.0,
        dimensions: '72" x 8" x 6"',
        warranty: '3 years',
        list_price: 399.95,
        discount_percentage: 25
      },
      {
        id: '3',
        name: 'Dual Battery Tray Kit',
        description: 'Complete dual battery tray system with mounting hardware',
        sku: 'KS-89567',
        quantity: 12,
        price: 89.95,
        cost: 53.97,
        category: 'Electrical',
        supplier: 'Keystone Automotive',
        reorder_level: 4,
        created_at: '2024-01-12T11:30:00Z',
        updated_at: '2024-01-19T13:15:00Z',
        keystone_vcpn: 'KS-89567',
        keystone_synced: true,
        keystone_last_sync: '2024-01-19T13:15:00Z',
        warehouse: 'Main',
        location: 'E5-F6',
        brand: 'PowerMax',
        weight: 8.5,
        dimensions: '14" x 10" x 4"',
        warranty: '1 year',
        list_price: 119.95,
        discount_percentage: 25
      },
      {
        id: '4',
        name: 'Grill Guard Mid-Size',
        description: 'Mid-size grill guard with integrated light mounting points',
        sku: 'KS-88923',
        quantity: 6,
        price: 199.95,
        cost: 119.97,
        category: 'Protection',
        supplier: 'Keystone Automotive',
        reorder_level: 2,
        created_at: '2024-01-08T14:20:00Z',
        updated_at: '2024-01-17T10:30:00Z',
        keystone_vcpn: 'KS-88923',
        keystone_synced: true,
        keystone_last_sync: '2024-01-17T10:30:00Z',
        warehouse: 'Main',
        location: 'G7-H8',
        brand: 'GuardPro',
        weight: 28.0,
        dimensions: '48" x 6" x 4"',
        warranty: '2 years',
        list_price: 249.95,
        discount_percentage: 20
      }
    ];
  }, []);

  // Fetch parts data
  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      const cachedData = loadFromCache();
      if (cachedData) {
        setParts(cachedData);
        setLoading(false);
        return;
      }

      // For now, use mock data
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      const mockData = getMockData();
      setParts(mockData);
      saveToCache(mockData);

    } catch (err) {
      console.error('Error fetching parts:', err);
      setError('Failed to load parts inventory. Please try again.');
      
      // Fallback to mock data
      const mockData = getMockData();
      setParts(mockData);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache, getMockData]);

  // Initialize component
  useEffect(() => {
    fetchParts();
    loadFavorites();
    loadCart();
  }, [fetchParts, loadFavorites, loadCart]);

  // Save cart whenever it changes
  useEffect(() => {
    saveCart(cart);
  }, [cart, saveCart]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(parts.map(part => part.category).filter(Boolean))];
    return cats.sort();
  }, [parts]);

  // Filter and sort parts
  useEffect(() => {
    let filtered = [...parts];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(term) ||
        part.description?.toLowerCase().includes(term) ||
        part.sku?.toLowerCase().includes(term) ||
        part.keystone_vcpn?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }

    // Apply price range filter
    filtered = filtered.filter(part => 
      part.price >= priceRange[0] && part.price <= priceRange[1]
    );

    // Apply stock filter
    if (showInStockOnly) {
      filtered = filtered.filter(part => part.quantity > 0);
    }

    // Apply sorting
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

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = filteredParts.slice(startIndex, endIndex);

  // Pagination component
  const Pagination = () => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredParts.length)} of {filteredParts.length} parts
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  // Toggle favorite
  const toggleFavorite = useCallback((partId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(partId)) {
        newFavorites.delete(partId);
      } else {
        newFavorites.add(partId);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // Cart management
  const addToCart = useCallback((part: InventoryPart, quantity: number = 1) => {
    if (part.quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.id === part.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > part.quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${part.quantity} items available.`,
            variant: "destructive",
          });
          return prev;
        }
        
        return prev.map(item =>
          item.id === part.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        if (quantity > part.quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${part.quantity} items available.`,
            variant: "destructive",
          });
          return prev;
        }
        
        const cartItem: CartItem = {
          id: part.id,
          name: part.name,
          price: part.price,
          quantity,
          sku: part.sku,
          category: part.category,
          inStock: part.quantity > 0,
          maxQuantity: part.quantity,
          vcpn: part.keystone_vcpn,
          weight: part.weight
        };
        
        return [...prev, cartItem];
      }
    });

    toast({
      title: "Added to Cart",
      description: `${part.name} has been added to your cart.`,
    });
  }, [toast]);

  const updateCartQuantity = useCallback((partId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(partId);
      return;
    }

    const part = parts.find(p => p.id === partId);
    if (part && newQuantity > part.quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${part.quantity} items available.`,
        variant: "destructive",
      });
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === partId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [parts, toast]);

  const removeFromCart = useCallback((partId: string) => {
    setCart(prev => prev.filter(item => item.id !== partId));
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart.",
    });
  }, [toast]);

  const clearCart = useCallback(() => {
    setCart([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart.",
    });
  }, [toast]);

  // Get cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  // Part detail dialog
  const openPartDetail = useCallback((part: InventoryPart) => {
    setSelectedPart(part);
    setIsDetailDialogOpen(true);
  }, []);

  // Render part card
  const renderPartCard = useCallback((part: InventoryPart) => {
    const isFavorite = favorites.has(part.id);
    const cartItem = cart.find(item => item.id === part.id);
    const inCart = !!cartItem;
    const cartQuantity = cartItem?.quantity || 0;

    return (
      <Card key={part.id} className="group hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{part.name}</h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {part.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(part.id)}
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">SKU: {part.sku}</span>
              {part.keystone_vcpn && (
                <Badge variant="outline" className="text-xs">
                  VCPN: {part.keystone_vcpn}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Category: {part.category}</span>
              <Badge variant={part.quantity > 0 ? "default" : "destructive"} className="text-xs">
                {part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'}
              </Badge>
            </div>
          </div>

          <PricingDisplay part={part} className="mb-3" />

          <div className="flex items-center gap-2">
            {inCart ? (
              <div className="flex items-center gap-2 flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCartQuantity(part.id, cartQuantity - 1)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">{cartQuantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCartQuantity(part.id, cartQuantity + 1)}
                  disabled={cartQuantity >= part.quantity}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => addToCart(part)}
                disabled={part.quantity <= 0}
                className="flex-1"
                size="sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to Cart
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPartDetail(part)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [favorites, cart, toggleFavorite, updateCartQuantity, addToCart, openPartDetail]);

  // Render part row (list view)
  const renderPartRow = useCallback((part: InventoryPart) => {
    const isFavorite = favorites.has(part.id);
    const cartItem = cart.find(item => item.id === part.id);
    const inCart = !!cartItem;
    const cartQuantity = cartItem?.quantity || 0;

    return (
      <TableRow key={part.id} className="group">
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(part.id)}
              className="h-6 w-6 p-0"
            >
              <Heart className={`h-3 w-3 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <div>
              <div className="font-medium text-sm">{part.name}</div>
              <div className="text-xs text-muted-foreground">{part.sku}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-sm">{part.category}</TableCell>
        <TableCell>
          <PricingDisplay part={part} />
        </TableCell>
        <TableCell>
          <Badge variant={part.quantity > 0 ? "default" : "destructive"} className="text-xs">
            {part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {inCart ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCartQuantity(part.id, cartQuantity - 1)}
                  className="h-6 w-6 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm w-6 text-center">{cartQuantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCartQuantity(part.id, cartQuantity + 1)}
                  disabled={cartQuantity >= part.quantity}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => addToCart(part)}
                disabled={part.quantity <= 0}
                size="sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPartDetail(part)}
              className="h-6 w-6 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }, [favorites, cart, toggleFavorite, updateCartQuantity, addToCart, openPartDetail]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingWrapper isLoading={true} message="Loading parts inventory..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parts Inventory</h1>
          <p className="text-muted-foreground">
            Database • {filteredParts.length} of {parts.length} parts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCartOpen(true)}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({cart.length})
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {cart.length}
              </Badge>
            )}
          </Button>
          
          <Button onClick={fetchParts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search parts..."
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
                  <SelectValue placeholder="All Categories" />
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
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="updated">Updated</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3"
                >
                  {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* View Mode */}
            <div className="space-y-2">
              <Label>View</Label>
              <div className="flex gap-2">
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
          </div>

          {/* Price Range */}
          <div className="space-y-2 mb-4">
            <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={1000}
              step={10}
              className="w-full"
            />
          </div>

          {/* Additional Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="in-stock"
                checked={showInStockOnly}
                onCheckedChange={setShowInStockOnly}
              />
              <Label htmlFor="in-stock">Show in-stock items only</Label>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="text-sm">Items per page:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-20">
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
        </CardContent>
      </Card>

      {/* Parts Display */}
      <LoadingWrapper isLoading={loading}>
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No parts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentParts.map(renderPartCard)}
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
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
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <Pagination />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </LoadingWrapper>

      {/* Part Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPart?.name}</DialogTitle>
            <DialogDescription>
              Part details and specifications
            </DialogDescription>
          </DialogHeader>
          
          {selectedPart && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPart.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">SKU</Label>
                      <p className="text-sm mt-1">{selectedPart.sku}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm mt-1">{selectedPart.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Supplier</Label>
                      <p className="text-sm mt-1">{selectedPart.supplier}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Brand</Label>
                      <p className="text-sm mt-1">{selectedPart.brand || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedPart.keystone_vcpn && (
                    <div>
                      <Label className="text-sm font-medium">Keystone VCPN</Label>
                      <p className="text-sm mt-1">{selectedPart.keystone_vcpn}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <PricingDisplay part={selectedPart} />
                  
                  <div>
                    <Label className="text-sm font-medium">Stock Information</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Stock:</span>
                        <Badge variant={selectedPart.quantity > 0 ? "default" : "destructive"}>
                          {selectedPart.quantity}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Reorder Level:</span>
                        <span>{selectedPart.reorder_level || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Location:</span>
                        <span>{selectedPart.location || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPart.dimensions && (
                    <div>
                      <Label className="text-sm font-medium">Specifications</Label>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Dimensions:</span>
                          <span>{selectedPart.dimensions}</span>
                        </div>
                        {selectedPart.weight && (
                          <div className="flex justify-between">
                            <span>Weight:</span>
                            <span>{selectedPart.weight} lbs</span>
                          </div>
                        )}
                        {selectedPart.warranty && (
                          <div className="flex justify-between">
                            <span>Warranty:</span>
                            <span>{selectedPart.warranty}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Check Integration */}
              {selectedPart.keystone_vcpn && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-2 block">Real-Time Price Check</Label>
                  <ProductPriceCheck vcpn={selectedPart.keystone_vcpn} />
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  onClick={() => addToCart(selectedPart)}
                  disabled={selectedPart.quantity <= 0}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(selectedPart.id)}
                >
                  <Heart className={`h-4 w-4 ${favorites.has(selectedPart.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Cart Drawer */}
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

export default Parts;

