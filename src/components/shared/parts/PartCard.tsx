
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, FileBarChart, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Part } from "@/types/parts";

interface PartCardProps {
  part: Part;
  onAddToCart?: (part: Part) => void;
  onAddToQuotation?: (part: Part) => void;
  onViewDetails: (partId: string) => void;
  onOpenCoreReturn?: (part: Part) => void;
  showInventory?: boolean;
}

export const PartCard = ({ 
  part, 
  onAddToCart, 
  onAddToQuotation,
  onViewDetails,
  onOpenCoreReturn,
  showInventory = false 
}: PartCardProps) => {
  const { id, name, sku, description, price, quantity, category, core_charge } = part;
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine stock status for styling
  const stockStatus = quantity <= 0 
    ? 'out-of-stock' 
    : quantity <= (part.reorder_level || 5) 
      ? 'low-stock' 
      : 'in-stock';
  
  // Get placeholder image if no part image is available
  const imageSrc = part.images && part.images.length > 0 
    ? part.images[0] 
    : '/placeholder.svg';
  
  // Format the description for display, limit to 50 chars
  const shortDescription = description 
    ? description.length > 50 
      ? `${description.substring(0, 50)}...` 
      : description 
    : 'No description available';
  
  // Handle stock status badge
  const getStockBadge = () => {
    if (!showInventory) return null;
    
    switch (stockStatus) {
      case 'out-of-stock':
        return <Badge variant="destructive">Out of stock</Badge>;
      case 'low-stock':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Low stock: {quantity}</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-500">In stock: {quantity}</Badge>;
    }
  };
  
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(part);
    }
  };
  
  const handleAddToQuotation = () => {
    if (onAddToQuotation) {
      onAddToQuotation(part);
    }
  };
  
  const handleCoreReturn = () => {
    if (onOpenCoreReturn) {
      onOpenCoreReturn(part);
    }
  };
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all", 
        isHovered ? "shadow-md" : "shadow-sm"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-0">
        <div className="relative">
          <AspectRatio ratio={4/3} className="bg-muted">
            <img 
              src={imageSrc} 
              alt={name} 
              className="object-cover w-full h-full rounded-t-lg"
            />
          </AspectRatio>
          {category && (
            <Badge className="absolute top-2 left-2 bg-black bg-opacity-60 hover:bg-opacity-70">
              {category}
            </Badge>
          )}
          {getStockBadge() && (
            <div className="absolute top-2 right-2">
              {getStockBadge()}
            </div>
          )}
          {core_charge && core_charge > 0 && (
            <Badge className="absolute bottom-2 right-2 bg-blue-500">
              Core: ${core_charge.toFixed(2)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-1.5">
          <CardTitle className="line-clamp-1 text-base">{name}</CardTitle>
          {sku && (
            <div className="text-xs text-muted-foreground">
              SKU: {sku}
            </div>
          )}
          <CardDescription className="line-clamp-2 text-xs min-h-[2.5rem]">
            {shortDescription}
          </CardDescription>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 pt-0 gap-3">
        <div className="flex justify-between items-center w-full">
          <div className="text-lg font-bold">
            ${price.toFixed(2)}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewDetails(id)} 
            className="p-0 h-auto"
          >
            <Eye className="h-4 w-4 mr-1" />
            <span className="text-xs">Details</span>
          </Button>
        </div>
        <div className="flex w-full gap-2">
          {onAddToCart && (
            <Button 
              onClick={handleAddToCart}
              disabled={quantity <= 0} 
              className="flex-1"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span>Add</span>
            </Button>
          )}
          {onAddToQuotation && (
            <Button 
              onClick={handleAddToQuotation}
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <FileBarChart className="h-4 w-4 mr-1" />
              <span>Quote</span>
            </Button>
          )}
          {onOpenCoreReturn && core_charge && core_charge > 0 && (
            <Button 
              onClick={handleCoreReturn}
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <ArrowLeftRight className="h-4 w-4 mr-1" />
              <span>Return</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
