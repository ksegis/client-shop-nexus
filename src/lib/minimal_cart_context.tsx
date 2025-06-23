'use client';

// Minimal Cart Context - Leverages Existing APIs
// Only adds global state management to existing cart functionality

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Use existing interfaces from your current cart implementation
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

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

interface CartContextType {
  // State
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Utilities
  getItem: (vcpn: string) => CartItem | undefined;
  hasItem: (vcpn: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'shop_cart_items';
const TAX_RATE = 0.08; // 8% tax rate

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({
    items: [],
    isLoading: false,
    error: null
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const items = JSON.parse(saved);
        setState(prev => ({ ...prev, items }));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state.items]);

  // Calculate totals
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  // Add item to cart
  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setState(prev => {
      const existingItem = prev.items.find(item => item.vcpn === newItem.vcpn);
      
      if (existingItem) {
        // Update quantity of existing item
        return {
          ...prev,
          items: prev.items.map(item =>
            item.vcpn === newItem.vcpn
              ? { ...item, quantity: Math.min(item.quantity + newItem.quantity, item.maxQuantity) }
              : item
          )
        };
      } else {
        // Add new item
        const item: CartItem = {
          ...newItem,
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        return {
          ...prev,
          items: [...prev.items, item]
        };
      }
    });
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Update item quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          : item
      )
    }));
  };

  // Clear entire cart
  const clearCart = () => {
    setState(prev => ({
      ...prev,
      items: []
    }));
  };

  // Get item by VCPN
  const getItem = (vcpn: string) => {
    return state.items.find(item => item.vcpn === vcpn);
  };

  // Check if item exists in cart
  const hasItem = (vcpn: string) => {
    return state.items.some(item => item.vcpn === vcpn);
  };

  const contextValue: CartContextType = {
    // State
    items: state.items,
    itemCount,
    subtotal,
    total,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Utilities
    getItem,
    hasItem
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export type { CartItem, CartContextType };

