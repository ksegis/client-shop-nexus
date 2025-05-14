
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ChevronLeft } from 'lucide-react';
import { usePartsCart } from '@/contexts/parts/PartsCartContext';
import { useToast } from '@/hooks/use-toast';

const CustomerCheckout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = usePartsCart();
  const { toast } = useToast();
  
  useEffect(() => {
    // If cart is empty, redirect back to parts catalog
    if (cart.length === 0) {
      navigate('/customer/parts');
    }
  }, [cart.length, navigate]);
  
  const handlePlaceOrder = () => {
    // For Phase 1, just show a success message
    toast({
      title: "Order placed successfully",
      description: "Your order has been received and is being processed.",
    });
    
    // Clear the cart
    clearCart();
    
    // Redirect after a brief delay
    setTimeout(() => {
      navigate('/customer/parts');
    }, 2000);
  };
  
  return (
    <div className="max-w-3xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <Button 
        variant="ghost" 
        onClick={() => navigate('/customer/parts')}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Return to parts catalog
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Review your order before placing it</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.part.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.part.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} x ${item.part.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">
                  ${(item.part.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button className="w-full" onClick={handlePlaceOrder}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Place Order
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Next Steps (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            In future updates, you'll be able to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Select from multiple payment methods</li>
            <li>Choose pickup or delivery options</li>
            <li>View estimated pickup/delivery times</li>
            <li>Track order status after placement</li>
            <li>Manage core charges and returns</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerCheckout;
