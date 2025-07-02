import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Package, 
  Truck, 
  Shield,
  Star,
  Info
} from 'lucide-react';
import ProductPriceCheck from '@/components/ProductPriceCheck';

interface ProductPageExampleProps {
  productId?: string;
}

const ProductPageExample: React.FC<ProductPageExampleProps> = ({ 
  productId = 'example-product' 
}) => {
  // Example product data - in real implementation, this would come from your product API/database
  const product = {
    id: 'WIDGET-001',
    vcpn: 'WIDGET-001',
    name: 'Professional Widget Pro Max',
    description: 'High-performance widget designed for professional applications. Features advanced technology and premium materials for maximum durability and efficiency.',
    category: 'Professional Tools',
    brand: 'WidgetCorp',
    model: 'WC-PRO-MAX-2024',
    sku: 'WGT-001-PRO',
    listPrice: 299.99,
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    specifications: {
      'Dimensions': '12" x 8" x 4"',
      'Weight': '2.5 lbs',
      'Material': 'Aircraft-grade aluminum',
      'Warranty': '2 years',
      'Certification': 'ISO 9001, CE'
    },
    features: [
      'Advanced precision engineering',
      'Corrosion-resistant coating',
      'Ergonomic design',
      'Professional-grade performance',
      'Easy maintenance'
    ],
    inStock: true,
    rating: 4.8,
    reviewCount: 127
  };

  const handleAddToCart = () => {
    // In real implementation, this would add the product to cart
    console.log('Adding to cart:', product.vcpn);
    alert(`Added ${product.name} to cart!`);
  };

  const handleWishlist = () => {
    // In real implementation, this would add to wishlist
    console.log('Adding to wishlist:', product.vcpn);
    alert(`Added ${product.name} to wishlist!`);
  };

  const handleShare = () => {
    // In real implementation, this would open share dialog
    console.log('Sharing product:', product.vcpn);
    alert('Share functionality would open here');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="h-24 w-24 text-gray-400" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {product.images.slice(1).map((image, index) => (
              <div key={index} className="aspect-square bg-gray-100 rounded border cursor-pointer hover:border-blue-500">
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Product Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{product.category}</Badge>
              <Badge variant="secondary">{product.brand}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span><strong>VCPN:</strong> {product.vcpn}</span>
              <span><strong>SKU:</strong> {product.sku}</span>
              <span><strong>Model:</strong> {product.model}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Live Pricing Component */}
          <ProductPriceCheck
            vcpn={product.vcpn}
            listPrice={product.listPrice}
            productName={product.name}
            showComparison={true}
            autoCheck={true}
            className="border-2 border-blue-100"
          />

          {/* Product Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleAddToCart}
                className="flex-1 h-12 text-lg"
                disabled={!product.inStock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12"
                onClick={handleWishlist}
              >
                <Heart className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">In Stock - Ready to Ship</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                </>
              )}
            </div>
          </div>

          {/* Shipping & Returns */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Free Shipping</p>
                    <p className="text-sm text-muted-foreground">On orders over $99</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">2-Year Warranty</p>
                    <p className="text-sm text-muted-foreground">Manufacturer warranty included</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Easy Returns</p>
                    <p className="text-sm text-muted-foreground">30-day return policy</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <div className="border-b">
          <nav className="flex space-x-8">
            <button className="border-b-2 border-blue-600 py-2 px-1 text-sm font-medium text-blue-600">
              Description
            </button>
            <button className="py-2 px-1 text-sm font-medium text-muted-foreground hover:text-gray-900">
              Specifications
            </button>
            <button className="py-2 px-1 text-sm font-medium text-muted-foreground hover:text-gray-900">
              Reviews ({product.reviewCount})
            </button>
            <button className="py-2 px-1 text-sm font-medium text-muted-foreground hover:text-gray-900">
              Shipping & Returns
            </button>
          </nav>
        </div>

        <div className="py-8">
          {/* Description Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product Description</h3>
              <p className="text-muted-foreground mb-6">{product.description}</p>
              
              <h4 className="font-semibold mb-3">Key Features</h4>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Specifications</h3>
              <div className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium">{key}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Notice */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Live Pricing Integration</h4>
              <p className="text-sm text-blue-800">
                This product page demonstrates the <strong>ProductPriceCheck</strong> component integration. 
                The pricing section above shows real-time pricing from Keystone, including current costs, 
                availability status, and price comparisons. The component automatically handles rate limiting 
                and provides a seamless user experience.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductPageExample;

