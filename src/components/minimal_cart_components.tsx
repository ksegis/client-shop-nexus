'use client';

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
import { useCart, CartItem } from './minimal_cart_context';
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
        <div className="mt-6">
          <CartDrawer onClose={() => setIsOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Add to Cart Button - Reusable for any page
interface AddToCartButtonProps {
  vcpn: string;
  name: string;
  price: number;
  quantity?: number;
  sku?: string;
  category?: string;
  inStock?: boolean;
  maxQuantity?: number;
  weight?: number;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function AddToCartButton({ 
  vcpn,
  name,
  price,
  quantity = 1,
  sku,
  category,
  inStock = true,
  maxQuantity = 999,
  weight,
  variant = 'default',
  size = 'default',
  className = '',
  onSuccess,
  onError
}: AddToCartButtonProps) {
  const { addItem, hasItem } = useCart();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!vcpn || !inStock) {
      onError?.('Item not available');
      return;
    }

    setIsAdding(true);
    try {
      addItem({
        name,
        price,
        quantity,
        sku,
        category,
        inStock,
        maxQuantity,
        vcpn,
        weight
      });
      
      toast({
        title: "Added to Cart",
        description: `${name} has been added to your cart.`,
      });
      
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
      onError?.(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const isInCart = hasItem(vcpn);

  return (
    <Button
      variant={isInCart ? 'outline' : variant}
      size={size}
      className={className}
      onClick={handleAddToCart}
      disabled={isAdding || !inStock}
    >
      {isAdding ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : isInCart ? (
        <Plus className="h-4 w-4 mr-2" />
      ) : (
        <Plus className="h-4 w-4 mr-2" />
      )}
      {isAdding ? 'Adding...' : isInCart ? 'Add More' : 'Add to Cart'}
    </Button>
  );
}

// Cart Item Component
interface CartItemComponentProps {
  item: CartItem;
  showActions?: boolean;
}

export function CartItemComponent({ item, showActions = true }: CartItemComponentProps) {
  const { updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{item.name}</h4>
          <p className="text-sm text-gray-600">{item.vcpn || item.sku}</p>
          {item.category && (
            <Badge variant="outline" className="mt-1">{item.category}</Badge>
          )}
        </div>
        {showActions && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showActions && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Quantity</Label>
            <div className="flex items-center mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="mx-2 text-center"
                min="1"
                max={item.maxQuantity}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={item.quantity >= item.maxQuantity}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Unit Price</Label>
            <div className="mt-1 p-2 bg-gray-50 rounded text-center">
              ${item.price.toFixed(2)}
            </div>
          </div>
          <div>
            <Label className="text-xs">Total</Label>
            <div className="mt-1 p-2 bg-gray-50 rounded text-center font-medium">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Cart Drawer Content
interface CartDrawerProps {
  onClose?: () => void;
}

export function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, itemCount, subtotal, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
        <p className="text-gray-500 mb-4">Add some items to get started</p>
        <Button onClick={onClose}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <CartItemComponent key={item.id} item={item} />
        ))}
      </div>

      {/* Cart Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal ({itemCount} items)</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (8%)</span>
            <span>${(total - subtotal).toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => {
            // Navigate to existing Special Orders page for checkout
            window.location.href = '/special-orders';
          }}
        >
          <Package className="h-4 w-4 mr-2" />
          Proceed to Checkout
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={clearCart}>
            Clear Cart
          </Button>
          <Button variant="outline" onClick={onClose}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}

// Quick Add Dialog - For manual item entry
interface QuickAddDialogProps {
  trigger: React.ReactNode;
}

export function QuickAddDialog({ trigger }: QuickAddDialogProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    vcpn: '',
    name: '',
    price: '',
    quantity: '1'
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vcpn || !formData.name) return;

    setIsAdding(true);
    try {
      addItem({
        vcpn: formData.vcpn,
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        quantity: parseInt(formData.quantity) || 1,
        inStock: true,
        maxQuantity: 999
      });
      
      toast({
        title: "Added to Cart",
        description: `${formData.name} has been added to your cart.`,
      });
      
      // Reset form and close dialog
      setFormData({ vcpn: '', name: '', price: '', quantity: '1' });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item to Cart</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vcpn">VCPN *</Label>
            <Input
              id="vcpn"
              value={formData.vcpn}
              onChange={(e) => setFormData({ ...formData, vcpn: e.target.value })}
              placeholder="Enter VCPN"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Item name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price">Unit Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isAdding || !formData.vcpn || !formData.name} className="flex-1">
              {isAdding ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isAdding ? 'Adding...' : 'Add to Cart'}
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

// Cart Status Badge - Shows cart status in header
export function CartStatusBadge() {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <Badge variant="secondary" className="ml-2">
      <ShoppingCart className="h-3 w-3 mr-1" />
      {itemCount} items • ${total.toFixed(2)}
    </Badge>
  );
}

