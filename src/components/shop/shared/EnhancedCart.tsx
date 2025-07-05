import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, Package, Search, ExternalLink } from 'lucide-react';

// Types
interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  brand?: string;
  category?: string;
  isKit?: boolean;
  kitComponents?: CartItem[];
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  expandKits: boolean;
}

// Cart Context Hook (simplified version)
const useCart = () => {
  const [cart, setCart] = useState<CartState>({
    items: [],
    isOpen: false,
    expandKits: true
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(prev => ({
          ...prev,
          items: parsedCart.items || []
        }));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify({ items: cart.items }));
  }, [cart.items]);

  const addItem = (item: CartItem) => {
    setCart(prev => {
      const existingItem = prev.items.find(i => i.id === item.id);
      if (existingItem) {
        return {
          ...prev,
          items: prev.items.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
          )
        };
      }
      return {
        ...prev,
        items: [...prev.items, item]
      };
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const clearCart = () => {
    setCart(prev => ({
      ...prev,
      items: []
    }));
  };

  const toggleCart = () => {
    setCart(prev => ({
      ...prev,
      isOpen: !prev.isOpen
    }));
  };

  const setExpandKits = (expand: boolean) => {
    setCart(prev => ({
      ...prev,
      expandKits: expand
    }));
  };

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    toggleCart,
    setExpandKits,
    totalItems,
    totalPrice
  };
};

// Order Lookup Component
const QuickOrderLookup: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    
    // Navigate to order tracking page with search term
    const searchUrl = `/orders?search=${encodeURIComponent(searchTerm.trim())}`;
    window.open(searchUrl, '_blank');
    
    setIsSearching(false);
    setSearchTerm('');
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Order Lookup</h3>
      <form onSubmit={handleSearch} className="flex space-x-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Order ID or Email"
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSearching || !searchTerm.trim()}
          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          {isSearching ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
          ) : (
            <Search className="w-3 h-3" />
          )}
        </button>
      </form>
    </div>
  );
};

// Cart Item Component
const CartItemComponent: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  expandKits: boolean;
}> = ({ item, onUpdateQuantity, onRemove, expandKits }) => {
  const [showKitComponents, setShowKitComponents] = useState(false);

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(0, item.quantity + change);
    onUpdateQuantity(item.id, newQuantity);
  };

  return (
    <div className="border-b border-gray-200 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-start space-x-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
          <p className="text-xs text-gray-500">SKU: {item.sku}</p>
          {item.brand && (
            <p className="text-xs text-gray-500">Brand: {item.brand}</p>
          )}
          {item.isKit && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                Kit
              </span>
              {item.kitComponents && item.kitComponents.length > 0 && (
                <button
                  onClick={() => setShowKitComponents(!showKitComponents)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showKitComponents ? 'Hide' : 'Show'} Components ({item.kitComponents.length})
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              ${item.price.toFixed(2)} each
            </p>
          </div>
          
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Kit Components */}
      {item.isKit && showKitComponents && item.kitComponents && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Kit Components:</p>
          {item.kitComponents.map((component, index) => (
            <div key={index} className="flex justify-between text-xs text-gray-600 mb-1">
              <span className="truncate mr-2">
                {component.name} (SKU: {component.sku})
              </span>
              <span className="whitespace-nowrap">
                {component.quantity} × ${component.price.toFixed(2)}
              </span>
            </div>
          ))}
          {expandKits && (
            <p className="text-xs text-blue-600 mt-2">
              ✓ Components will be ordered individually
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Cart Drawer Component
const CartDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cart: CartState;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSetExpandKits: (expand: boolean) => void;
  totalPrice: number;
}> = ({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onClearCart, onSetExpandKits, totalPrice }) => {
  if (!isOpen) return null;

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  const handleTrackOrders = () => {
    // Navigate to order tracking page
    window.open('/orders', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Shopping Cart ({cart.items.length})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Cart Settings */}
          {cart.items.some(item => item.isKit) && (
            <div className="p-4 bg-gray-50 border-b">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={cart.expandKits}
                  onChange={(e) => onSetExpandKits(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Expand kits into individual components
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, kit items will be broken down for ordering
              </p>
            </div>
          )}
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add some parts to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItemComponent
                    key={item.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemoveItem}
                    expandKits={cart.expandKits}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Proceed to Checkout
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleTrackOrders}
                    className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm flex items-center justify-center space-x-1"
                  >
                    <Package className="w-4 h-4" />
                    <span>Track Orders</span>
                  </button>
                  
                  <button
                    onClick={onClearCart}
                    className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
              
              {/* Quick Order Lookup */}
              <QuickOrderLookup />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Cart Widget Component (for header/navigation)
const CartWidget: React.FC = () => {
  const {
    cart,
    updateQuantity,
    removeItem,
    clearCart,
    toggleCart,
    setExpandKits,
    totalItems,
    totalPrice
  } = useCart();

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={toggleCart}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </button>
      
      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cart.isOpen}
        onClose={toggleCart}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onSetExpandKits={setExpandKits}
        totalPrice={totalPrice}
      />
    </>
  );
};

// Enhanced Cart Component (main export)
export const EnhancedCart: React.FC = () => {
  return <CartWidget />;
};

// Export individual components for flexibility
export { CartWidget, CartDrawer, CartItemComponent, QuickOrderLookup };

export default EnhancedCart;

