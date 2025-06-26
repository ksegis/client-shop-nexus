import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  Loader2,
  Eye,
  Settings,
  Box,
  ChevronDown,
  ChevronRight,
  Info
} from "lucide-react";
import { useCart, CartItem } from '@/lib/minimal_cart_context';
import { useToast } from "@/hooks/use-toast";
import { KitBadge, CompactKitDisplay } from '@/components/kit_components_display';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Add to Cart Button Component
interface AddToCartButtonProps {
  part: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  };
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  part,
  className = "",
  size = "default",
  disabled = false
}) => {
  const { addItem, isLoading } = useCart();
  const { toast } = useToast();

  const handleAddToCart = async () => {
    if (part.quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock",
        variant: "destructive"
      });
      return;
    }

    await addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      maxQuantity: part.quantity
    });
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || isLoading || part.quantity <= 0}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 mr-2" />
      )}
      Add to Cart
    </Button>
  );
};

// Kit Components Preview in Cart
interface KitComponentsPreviewProps {
  item: CartItem;
  expanded?: boolean;
  onToggle?: () => void;
}

const KitComponentsPreview: React.FC<KitComponentsPreviewProps> = ({
  item,
  expanded = false,
  onToggle
}) => {
  const { loadKitComponents } = useCart();

  if (!item.isKit) return null;

  const handleLoadComponents = async () => {
    if (!item.kitComponentsLoaded) {
      await loadKitComponents(item.id);
    }
  };

  return (
    <div className="mt-2 border-l-2 border-blue-200 pl-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          handleLoadComponents();
          onToggle?.();
        }}
        className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 mr-1" />
        ) : (
          <ChevronRight className="h-3 w-3 mr-1" />
        )}
        <Box className="h-3 w-3 mr-1" />
        {item.kitComponentsLoaded 
          ? `${item.kitComponents?.length || 0} components`
          : 'Load kit components'
        }
      </Button>

      {expanded && item.kitComponentsLoaded && item.kitComponents && (
        <div className="mt-2 space-y-1">
          {item.kitComponents.map((component, index) => (
            <div key={`${component.component_vcpn}-${index}`} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-600">{component.quantity}×</span>
                <span className="font-mono text-xs bg-gray-200 px-1 rounded">
                  {component.component_vcpn}
                </span>
                <span className="flex-1">{component.description || 'No description'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Cart Item Component
interface CartItemComponentProps {
  item: CartItem;
  showKitComponents?: boolean;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  showKitComponents = true
}) => {
  const { updateQuantity, removeItem, kitExpansionEnabled } = useCart();
  const [kitExpanded, setKitExpanded] = useState(false);

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{item.name}</h4>
          {item.isKit && <KitBadge />}
        </div>
        
        <div className="text-sm text-muted-foreground mb-2">
          ${item.price.toFixed(2)} each
        </div>

        {/* Kit Components Preview */}
        {item.isKit && showKitComponents && kitExpansionEnabled && (
          <KitComponentsPreview
            item={item}
            expanded={kitExpanded}
            onToggle={() => setKitExpanded(!kitExpanded)}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border rounded">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.maxQuantity ? item.quantity >= item.maxQuantity : false}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="text-right min-w-[4rem]">
          <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeItem(item.id)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Cart Settings Component
const CartSettings: React.FC = () => {
  const { kitExpansionEnabled, setKitExpansionEnabled } = useCart();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="kit-expansion" className="text-sm font-medium">
            Enable Kit Expansion in Cart
          </Label>
          <div className="text-xs text-muted-foreground">
            Show individual kit components during checkout
          </div>
        </div>
        <Switch
          id="kit-expansion"
          checked={kitExpansionEnabled}
          onCheckedChange={setKitExpansionEnabled}
        />
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          When enabled, kit components will be displayed during checkout for review. 
          The parent kit VCPN will still be sent in the order unless overridden.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Cart Widget Component
export const CartWidget: React.FC = () => {
  const { items, total, itemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {itemCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
              {itemCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Shopping Cart ({itemCount} items)</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Cart Settings</DialogTitle>
                </DialogHeader>
                <CartSettings />
              </DialogContent>
            </Dialog>
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground">Add some items to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemComponent key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to special orders
                  const url = new URL(window.location);
                  url.searchParams.set('tab', 'special-orders');
                  window.history.pushState({}, '', url);
                  window.location.reload();
                }}
                disabled={items.length === 0}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Enhanced Cart Summary for Special Orders
interface CartSummaryProps {
  showKitDetails?: boolean;
  className?: string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  showKitDetails = true,
  className = ""
}) => {
  const { items, total, kitExpansionEnabled } = useCart();

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No items in cart</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{item.name}</span>
                    {item.isKit && <KitBadge />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                  </div>
                  
                  {/* Kit components summary */}
                  {item.isKit && showKitDetails && kitExpansionEnabled && (
                    <CompactKitDisplay 
                      kitVcpn={item.id} 
                      componentCount={item.kitComponents?.length}
                      className="mt-1 text-xs"
                    />
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Subtotal:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {/* Kit expansion notice */}
        {items.some(item => item.isKit) && (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {kitExpansionEnabled 
                ? "Kit components will be shown during checkout for review"
                : "Kits will be ordered as complete units"
              }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default { AddToCartButton, CartWidget, CartSummary };

