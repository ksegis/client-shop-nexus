// Minimal Cart Components - Leverages Existing UI Components
// Reusable components that integrate with existing design system

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  RefreshCw,
  Package,
  ArrowRight
} from 'lucide-react';
import { useCart, CartItem } from '@/lib/minimal_cart_context';
import { useToast } from "@/hooks/use-toast";

// Cart Widget - Shows in header/navigation
export function CartWidget() {
  const { items, itemCount, total } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {itemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {itemCount}
            </Badge>
          )}
          <span className="ml-2 hidden sm:inline">
            ${total.toFixed(2)}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({itemCount} items)
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <CartItemCard key={item.vcpn} item={item} />
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                  Continue Shopping
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Cart Item Card - Individual item in cart
function CartItemCard({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        <Package className="h-6 w-6 text-gray-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{item.name}</h3>
        <p className="text-xs text-gray-500">{item.sku}</p>
        <p className="text-sm font-semibold text-green-600">${item.price.toFixed(2)}</p>
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
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Add to Cart Button - Reusable button for any page
interface AddToCartButtonProps {
  vcpn: string;
  name: string;
  price: number;
  sku?: string;
  category?: string;
  inStock?: boolean;
  maxQuantity?: number;
  weight?: number;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function AddToCartButton({
  vcpn,
  name,
  price,
  sku,
  category,
  inStock = true,
  maxQuantity = 999,
  weight,
  className = '',
  size = 'default',
  onSuccess,
  onError
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!inStock) {
      const error = 'Item is out of stock';
      onError?.(error);
      return;
    }

    setIsLoading(true);
    
    try {
      const cartItem: CartItem = {
        vcpn,
        name,
        price,
        quantity: 1,
        sku,
        category,
        inStock,
        maxQuantity,
        weight
      };

      addItem(cartItem);
      onSuccess?.();
      
    } catch (error) {
      const errorMessage = 'Failed to add item to cart';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={!inStock || isLoading}
      size={size}
      className={className}
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 mr-2" />
      )}
      {inStock ? 'Add to Cart' : 'Out of Stock'}
    </Button>
  );
}

// Quick Add Dialog - For manual item entry
export function QuickAddDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    vcpn: '',
    name: '',
    price: '',
    quantity: '1',
    sku: '',
    category: ''
  });
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vcpn || !formData.name || !formData.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const cartItem: CartItem = {
      vcpn: formData.vcpn,
      name: formData.name,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      sku: formData.sku,
      category: formData.category,
      inStock: true,
      maxQuantity: 999
    };

    addItem(cartItem);
    
    toast({
      title: "Added to Cart",
      description: `${formData.name} has been added to your cart.`,
    });

    // Reset form
    setFormData({
      vcpn: '',
      name: '',
      price: '',
      quantity: '1',
      sku: '',
      category: ''
    });
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item to Cart</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vcpn">VCPN *</Label>
              <Input
                id="vcpn"
                value={formData.vcpn}
                onChange={(e) => setFormData({...formData, vcpn: e.target.value})}
                placeholder="Enter VCPN"
                required
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="Enter SKU"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter product name"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Category"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Add to Cart
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

