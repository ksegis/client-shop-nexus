import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { kitComponentService, KitComponent } from '@/services/kit_component_service';

// Cart item interface with kit support
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity?: number;
  isKit?: boolean;
  kitComponents?: KitComponent[];
  kitComponentsLoaded?: boolean;
}

// Cart context interface
interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
  kitExpansionEnabled: boolean;
  setKitExpansionEnabled: (enabled: boolean) => void;
  loadKitComponents: (itemId: string) => Promise<void>;
  getKitPreview: (itemId: string) => KitComponent[] | null;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [kitExpansionEnabled, setKitExpansionEnabled] = useState(true); // Default to enabled
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }

    // Load kit expansion setting
    const savedKitExpansion = localStorage.getItem('kitExpansionEnabled');
    if (savedKitExpansion !== null) {
      setKitExpansionEnabled(JSON.parse(savedKitExpansion));
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Save kit expansion setting
  useEffect(() => {
    localStorage.setItem('kitExpansionEnabled', JSON.stringify(kitExpansionEnabled));
  }, [kitExpansionEnabled]);

  // Check if an item is a kit
  const checkIfKit = async (itemId: string): Promise<boolean> => {
    try {
      return await kitComponentService.isKit(itemId);
    } catch (error) {
      console.error('Error checking if item is kit:', error);
      return false;
    }
  };

  // Load kit components for an item
  const loadKitComponents = async (itemId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await kitComponentService.getKitComponentsWithCache(itemId);
      
      if (response.success) {
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? { 
                  ...item, 
                  kitComponents: response.components,
                  kitComponentsLoaded: true 
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error loading kit components:', error);
      toast({
        title: "Kit Components Error",
        description: "Failed to load kit components",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get kit preview for an item
  const getKitPreview = (itemId: string): KitComponent[] | null => {
    const item = items.find(item => item.id === itemId);
    return item?.kitComponents || null;
  };

  // Add item to cart with kit detection
  const addItem = async (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1): Promise<void> => {
    try {
      setIsLoading(true);

      // Check if item is a kit
      const isKit = await checkIfKit(newItem.id);
      
      // Load kit components if it's a kit and expansion is enabled
      let kitComponents: KitComponent[] = [];
      let kitComponentsLoaded = false;
      
      if (isKit && kitExpansionEnabled) {
        const response = await kitComponentService.getKitComponentsWithCache(newItem.id);
        if (response.success) {
          kitComponents = response.components;
          kitComponentsLoaded = true;
        }
      }

      setItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.id === newItem.id);
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...prevItems];
          const existingItem = updatedItems[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;
          
          // Check max quantity constraint
          if (newItem.maxQuantity && newQuantity > newItem.maxQuantity) {
            toast({
              title: "Quantity Limit Reached",
              description: `Cannot add more than ${newItem.maxQuantity} of this item`,
              variant: "destructive"
            });
            return prevItems;
          }
          
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            isKit,
            kitComponents: kitComponentsLoaded ? kitComponents : existingItem.kitComponents,
            kitComponentsLoaded: kitComponentsLoaded || existingItem.kitComponentsLoaded
          };
          
          return updatedItems;
        } else {
          // Add new item
          const cartItem: CartItem = {
            ...newItem,
            quantity,
            isKit,
            kitComponents: kitComponentsLoaded ? kitComponents : undefined,
            kitComponentsLoaded
          };
          
          return [...prevItems, cartItem];
        }
      });

      // Show success message with kit info
      const message = isKit 
        ? `Added ${newItem.name} (Kit with ${kitComponents.length} components) to cart`
        : `Added ${newItem.name} to cart`;
        
      toast({
        title: "Added to Cart",
        description: message
      });

    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = (id: string) => {
    setItems(prevItems => {
      const item = prevItems.find(item => item.id === id);
      const updatedItems = prevItems.filter(item => item.id !== id);
      
      if (item) {
        toast({
          title: "Removed from Cart",
          description: `${item.name} removed from cart`
        });
      }
      
      return updatedItems;
    });
  };

  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          // Check max quantity constraint
          if (item.maxQuantity && quantity > item.maxQuantity) {
            toast({
              title: "Quantity Limit",
              description: `Maximum quantity for this item is ${item.maxQuantity}`,
              variant: "destructive"
            });
            return item;
          }
          
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items removed from cart"
    });
  };

  // Calculate totals
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isLoading,
    kitExpansionEnabled,
    setKitExpansionEnabled,
    loadKitComponents,
    getKitPreview
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartProvider;

