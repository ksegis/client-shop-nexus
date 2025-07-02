
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useVehicles } from '@/hooks/useVehicles';
import { usePartsCatalog } from '@/hooks/parts/usePartsCatalog';
import { CustomerPartsCatalog } from '@/components/customer/parts/CustomerPartsCatalog';
import { CustomerPartsSidebar } from '@/components/customer/parts/CustomerPartsSidebar';
import { CustomerShoppingCart } from '@/components/customer/parts/CustomerShoppingCart';
import { PartDetailView } from '@/components/customer/parts/PartDetailView';
import { Part } from '@/types/parts';

const CustomerParts = () => {
  const { toast } = useToast();
  const { vehicles } = useVehicles();
  const [activeCategory, setActiveCategory] = useState<string>('All Parts');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [cartItems, setCartItems] = useState<(Part & { quantity: number })[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [categories, setCategories] = useState<string[]>(['All Parts']);
  
  // Use the catalog hook for data fetching
  const { 
    parts, 
    isLoading, 
    searchFilters, 
    setSearchFilters, 
    getCategories, 
    refreshCatalog 
  } = usePartsCatalog();
  
  // Initialize and load categories
  useEffect(() => {
    const loadCategories = async () => {
      toast({
        title: "Loading Parts Catalog",
        description: "Fetching parts and categories...",
      });
      
      refreshCatalog();
      const fetchedCategories = await getCategories();
      if (fetchedCategories && fetchedCategories.length > 0) {
        setCategories(['All Parts', ...fetchedCategories]);
      }
    };
    
    loadCategories();
  }, []);
  
  // Update search filters when inputs change
  useEffect(() => {
    setSearchFilters({
      query: searchQuery,
      category: activeCategory !== 'All Parts' ? activeCategory : undefined
    });
  }, [searchQuery, activeCategory, setSearchFilters]);
  
  // Open detail dialog for a part
  const openDetailDialog = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (part) {
      setSelectedPart(part);
      setIsDetailDialogOpen(true);
    }
  };
  
  // Add item to cart
  const addToCart = (part: Part, quantity = 1) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === part.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      setCartItems(updatedItems);
    } else {
      // Add new item
      setCartItems([...cartItems, { ...part, quantity }]);
    }
    
    toast({
      title: "Added to cart",
      description: `${part.name} added to your cart.`
    });
    
    setIsDetailDialogOpen(false);
  };
  
  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };
  
  // Update item quantity in cart
  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    const updatedItems = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity };
      }
      return item;
    });
    
    setCartItems(updatedItems);
  };
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Parts & Accessories Catalog</h1>
        
        <CustomerShoppingCart 
          cartItems={cartItems} 
          cartCount={cartItems.length} 
          setIsCartOpen={setIsCartOpen} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        {/* Sidebar with filters */}
        <CustomerPartsSidebar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedVehicle={selectedVehicle}
          setSelectedVehicle={setSelectedVehicle}
          vehicles={vehicles}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
        
        {/* Main content - Parts grid */}
        <CustomerPartsCatalog 
          parts={parts}
          isLoading={isLoading}
          activeCategory={activeCategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onAddToCart={addToCart}
          onViewDetails={openDetailDialog}
        />
      </div>
      
      {/* Part Detail Dialog */}
      <PartDetailView 
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        selectedPart={selectedPart}
        onAddToCart={addToCart}
      />
      
      {/* Shopping Cart Dialog */}
      <CustomerShoppingCart 
        isOpen={isCartOpen}
        setIsOpen={setIsCartOpen}
        cartItems={cartItems}
        updateCartQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        cartTotal={cartTotal}
      />
    </div>
  );
};

export default CustomerParts;
