
import { useState } from 'react';
import { usePartsCart } from '@/contexts/parts/PartsCartContext';
import { useToast } from '@/hooks/use-toast';
import { Part } from '@/types/parts';

export function useCartOperations() {
  const { toast } = useToast();
  const { 
    addToCart, 
    getCartItemCount,
    cart
  } = usePartsCart();
  
  const [cartOpen, setCartOpen] = useState(false);
  
  // Simple adapter function to handle single-parameter calls from PartCard
  const handleAddToCart = (part: Part) => {
    addToCart(part, 1);  // Default to quantity of 1
    
    toast({
      title: "Added to cart",
      description: `${part.name} has been added to your cart.`
    });
  };
  
  // Modified to match the expected signature in PartDetailDialog
  const handleAddToCartFromDialog = (part: Part, quantity: number) => {
    addToCart(part, quantity);
    
    toast({
      title: "Added to cart",
      description: `${part.name} has been added to your cart.`
    });
  };
  
  const handleProcessTransaction = () => {
    // For Phase 1, show a success toast
    toast({
      title: "Transaction processed",
      description: `Processed sale for ${getCartItemCount()} items.`,
    });
    
    // Clear the cart
    // In future phases, this would actually update inventory and create transaction records
    setTimeout(() => {
      // Give the user a moment to see the success message
      setCartOpen(false);
    }, 1500);
  };

  return {
    cartOpen,
    setCartOpen,
    getCartItemCount,
    handleAddToCart,
    handleAddToCartFromDialog,
    handleProcessTransaction
  };
}
