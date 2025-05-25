
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, ChevronLeft, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Part } from "@/types/parts";
import { getStockStatus, getStockBadge } from "@/components/shared/parts/detail";

interface CustomerPartDetailProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPart: Part | null;
  onAddToCart: (part: Part, quantity: number) => void;
}

export function CustomerPartDetail({
  isOpen,
  onClose,
  selectedPart,
  onAddToCart
}: CustomerPartDetailProps) {
  const [quantity, setQuantity] = useState(1);

  if (!selectedPart) return null;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(selectedPart, quantity);
  };

  // Get stock status details for the current part
  const stockStatus = getStockStatus(selectedPart.quantity);
  const availableStock = selectedPart.quantity || 0;
  const backlogQuantity = quantity > availableStock ? quantity - availableStock : 0;
  const isBackorder = backlogQuantity > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <DialogTitle className="text-center pt-8">{selectedPart.name}</DialogTitle>
          <DialogDescription className="text-center">
            Part Number: {selectedPart.sku}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
            {selectedPart.images && selectedPart.images.length > 0 ? (
              <img
                src={selectedPart.images[0]}
                alt={selectedPart.name}
                className="object-contain h-64 w-full"
              />
            ) : (
              <div className="flex items-center justify-center h-64 w-full bg-gray-200 text-gray-500">
                No image available
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg mb-1">Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">SKU:</div>
                <div>{selectedPart.sku}</div>
                <div className="font-medium">Category:</div>
                <div>{selectedPart.category}</div>
                <div className="font-medium">Brand:</div>
                <div>{selectedPart.supplier || "Generic"}</div>
                <div className="font-medium">Location:</div>
                <div>{selectedPart.location || "Main Warehouse"}</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-1">Specifications</h3>
              <p className="text-sm text-gray-600">
                {selectedPart.description || "No detailed specifications available."}
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-1">Availability</h3>
              <div className="flex items-center">
                {getStockBadge(selectedPart)}
                <span className="ml-2 text-sm">{stockStatus}</span>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">${selectedPart.price.toFixed(2)}</span>
                {selectedPart.core_charge && (
                  <Badge variant="outline" className="ml-2">
                    +${selectedPart.core_charge.toFixed(2)} Core Charge
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="w-20">
                  <label htmlFor="quantity" className="sr-only">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-full border rounded px-2 py-1 text-center"
                  />
                </div>

                {isBackorder && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>{backlogQuantity} item(s)</strong> will be backordered as they exceed available stock.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isBackorder ? "Add to Cart (with Backorder)" : "Add to Cart"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <h3 className="font-medium text-lg mb-2">Compatible Vehicles</h3>
          <p className="text-sm text-gray-600">
            {selectedPart.compatibility ? (
              selectedPart.compatibility
            ) : (
              "Universal fit for most vehicles. Contact us for specific compatibility information."
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
