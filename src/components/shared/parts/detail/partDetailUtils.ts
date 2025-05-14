
import { Badge } from "@/components/ui/badge";
import { Part } from "@/types/parts";
import React from "react";

// Determine stock status
export const getStockStatus = (part: Part) => {
  if (part.quantity <= 0) return 'out-of-stock';
  if (part.quantity <= (part.reorder_level || 5)) return 'low-stock';
  return 'in-stock';
};

// Get stock badge based on status
export const getStockBadge = (part: Part): React.ReactNode => {
  const status = getStockStatus(part);
  
  switch (status) {
    case 'out-of-stock':
      return <Badge variant="destructive">Out of stock</Badge>;
    case 'low-stock':
      return <Badge variant="outline" className="border-amber-500 text-amber-500">Low stock: {part.quantity}</Badge>;
    default:
      return <Badge variant="outline" className="border-green-500 text-green-500">In stock: {part.quantity}</Badge>;
  }
};
