// Cart Drawer Component - Best Practice UX Implementation
import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  category?: string;
  image?: string;
  inStock: boolean;
  maxQuantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { [key: string]: number };
  parts: any[];
  onUpdateQuantity: (partId: string, quantity: number) => void;
  onRemoveItem: (partId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  parts,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const { toast } = useToast();
  
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
      maxQuantity: part?.quantity || 0
    };
  }).filter(item => item.quantity > 0);

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax rate - adjust as needed
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const total = subtotal + tax + shipping;
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

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

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Add your checkout logic here
    console.log('🛒 Proceeding to checkout with items:', cartItems);
    toast({
      title: "Checkout",
      description: "Proceeding to checkout...",
      variant: "default",
    });
    
    // Example: Navigate to checkout page
    // router.push('/checkout');
  };

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Cart Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
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

        {/* Cart Content */}
        <div className="flex flex-col h-full">
          {cartItems.length === 0 ? (
            /* Empty Cart State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Add some parts to get started</p>
              <Button onClick={onClose} variant="outline">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                      {/* Item Image Placeholder */}
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-gray-400" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                        {item.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        )}
                        {item.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.category}
                          </Badge>
                        )}
                        
                        {/* Price and Stock Status */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-green-600">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className={`text-xs ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {item.inStock ? `${item.maxQuantity} in stock` : 'Out of stock'}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
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
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right mt-2">
                          <span className="text-sm font-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Cart Summary */}
              <div className="border-t p-4 space-y-4">
                {/* Clear Cart Button */}
                {cartItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearCart}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping === 0 && subtotal < 100 && (
                    <p className="text-xs text-green-600">
                      Free shipping on orders over $100
                    </p>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                {/* Continue Shopping */}
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Updated Cart Button Component
interface CartButtonProps {
  cart: { [key: string]: number };
  parts: any[];
  onOpenCart: () => void;
}

export const CartButton: React.FC<CartButtonProps> = ({ cart, parts, onOpenCart }) => {
  const totalItems = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const totalValue = Object.entries(cart).reduce((total, [partId, quantity]) => {
    const part = parts.find(p => p.id === partId);
    return total + (part?.price || 0) * quantity;
  }, 0);

  return (
    <Button 
      variant="outline" 
      className="relative"
      onClick={onOpenCart}
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      Cart ({totalItems})
      {totalItems > 0 && (
        <>
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
            {totalItems}
          </Badge>
          <span className="ml-2 text-sm text-green-600">
            ${totalValue.toFixed(2)}
          </span>
        </>
      )}
    </Button>
  );
};

