
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { usePartsCart, CartItem } from '@/contexts/parts/PartsCartContext';

interface PartsCartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const PartsCart = ({ isOpen, onClose, onCheckout }: PartsCartProps) => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getCartItemCount 
  } = usePartsCart();
  
  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    updateQuantity(item.part.id, newQuantity);
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Parts Cart ({getCartItemCount()})
          </SheetTitle>
          <SheetDescription>
            Review your selected parts before checkout.
          </SheetDescription>
        </SheetHeader>
        
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add parts from the catalog to get started.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4">
            {cart.map((item) => (
              <div key={item.part.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.part.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.part.sku}
                    </p>
                  </div>
                  <p className="text-right font-medium">
                    ${(item.part.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={item.part.quantity}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value) || 1)}
                      className="w-12 h-8 mx-1 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      disabled={item.quantity >= item.part.quantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeFromCart(item.part.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {item.part.core_charge && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Includes ${(item.part.core_charge * item.quantity).toFixed(2)} core charge
                  </p>
                )}
                
                <Separator className="my-2" />
              </div>
            ))}
          </div>
        )}
        
        {cart.length > 0 && (
          <>
            <div className="py-2 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold">${getCartTotal().toFixed(2)}</span>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Taxes will be calculated at checkout
              </p>
            </div>
            
            <SheetFooter className="sm:justify-between flex-col sm:flex-row gap-2 mt-2">
              <Button 
                variant="outline" 
                className="sm:flex-1"
                onClick={clearCart}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cart
              </Button>
              
              <SheetClose asChild>
                <Button 
                  className="sm:flex-1" 
                  onClick={onCheckout}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Checkout
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
