
import { createContext, useContext, useState, ReactNode } from 'react';
import { Part } from '@/types/parts';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  part: Part;
  quantity: number;
}

interface PartsCartContextType {
  cart: CartItem[];
  addToCart: (part: Part, quantity: number) => void;
  removeFromCart: (partId: string) => void;
  updateQuantity: (partId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isInCart: (partId: string) => boolean;
}

const PartsCartContext = createContext<PartsCartContextType | undefined>(undefined);

export const PartsCartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (part: Part, quantity: number) => {
    const existingItem = cart.find(item => item.part.id === part.id);
    
    if (existingItem) {
      // Update quantity if already in cart
      updateQuantity(part.id, existingItem.quantity + quantity);
      toast({
        title: "Cart updated",
        description: `Updated quantity of ${part.name} in your cart.`,
      });
    } else {
      // Add new item to cart
      setCart([...cart, { part, quantity }]);
      toast({
        title: "Added to cart",
        description: `${part.name} has been added to your cart.`,
      });
    }
  };

  const removeFromCart = (partId: string) => {
    const updatedCart = cart.filter(item => item.part.id !== partId);
    setCart(updatedCart);
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const updateQuantity = (partId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(partId);
      return;
    }

    const updatedCart = cart.map(item => 
      item.part.id === partId 
        ? { ...item, quantity: Math.min(quantity, item.part.quantity) } 
        : item
    );
    
    setCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.part.price * item.quantity;
      const coreCharge = item.part.core_charge ? item.part.core_charge * item.quantity : 0;
      return total + itemTotal + coreCharge;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const isInCart = (partId: string) => {
    return cart.some(item => item.part.id === partId);
  };

  return (
    <PartsCartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        isInCart,
      }}
    >
      {children}
    </PartsCartContext.Provider>
  );
};

export const usePartsCart = () => {
  const context = useContext(PartsCartContext);
  if (context === undefined) {
    throw new Error('usePartsCart must be used within a PartsCartProvider');
  }
  return context;
};
