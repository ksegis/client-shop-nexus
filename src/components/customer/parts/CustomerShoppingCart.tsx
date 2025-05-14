
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, ArrowRight } from 'lucide-react';
import { Part } from '@/types/parts';

interface CartItemType extends Part {
  quantity: number;
}

interface CartButtonProps {
  cartItems: CartItemType[];
  cartCount: number;
  setIsCartOpen: (isOpen: boolean) => void;
}

interface CustomerShoppingCartProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  cartItems: CartItemType[];
  updateCartQuantity?: (id: string, quantity: number) => void;
  removeFromCart?: (id: string) => void;
  cartTotal?: number;
}

// Component that can render either just a button or the full cart dialog
export const CustomerShoppingCart = (props: CartButtonProps | CustomerShoppingCartProps) => {
  // If this is just the button being rendered (in the header)
  if ('cartCount' in props && !('isOpen' in props)) {
    const { cartCount, setIsCartOpen } = props;
    return (
      <Button 
        variant="outline" 
        className="relative"
        onClick={() => setIsCartOpen(true)}
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="ml-2">Cart</span>
        {cartCount > 0 && (
          <Badge className="absolute -top-2 -right-2 px-1 min-w-[20px] h-5 rounded-full">
            {cartCount}
          </Badge>
        )}
      </Button>
    );
  }

  // Full cart dialog component
  const { 
    isOpen = false, 
    setIsOpen = () => {}, 
    cartItems = [],
    updateCartQuantity = () => {}, 
    removeFromCart = () => {}, 
    cartTotal = 0 
  } = props;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] sm:h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Your Cart</DialogTitle>
          <DialogDescription>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-auto p-6 pt-2">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-1">Your cart is empty</h3>
              <p className="text-gray-500 mb-4">
                Browse our parts catalog and add items to your cart.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 border-b pb-4">
                  <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {item.images && item.images.length > 0 ? (
                      <img 
                        src={item.images[0]} 
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs">No image</div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">{item.name}</h4>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                        <button 
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="border-t p-6">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span className="font-medium">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Estimated Tax</span>
              <span className="font-medium">${(cartTotal * 0.08).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Total</span>
              <span>${(cartTotal * 1.08).toFixed(2)}</span>
            </div>
            <Button className="w-full">
              Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full mt-2"
              onClick={() => setIsOpen(false)}
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
