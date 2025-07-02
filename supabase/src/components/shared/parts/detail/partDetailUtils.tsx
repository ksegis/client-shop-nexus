
import { Badge } from "@/components/ui/badge";
import { Part } from "@/types/parts";
import { cn } from "@/lib/utils";

export const getStockStatus = (quantity: number): string => {
  if (quantity <= 0) {
    return "Out of stock";
  } else if (quantity < 5) {
    return "Low stock";
  } else {
    return "In stock";
  }
};

export const getStockBadge = (part: Part) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let text = "In stock";
  
  if (part.quantity <= 0) {
    variant = "destructive";
    text = "Out of stock";
  } else if (part.quantity < 5) {
    variant = "secondary";
    text = "Low stock";
  }
  
  return (
    <Badge variant={variant} className={cn("capitalize", {
      "bg-red-500 hover:bg-red-500": part.quantity <= 0,
      "bg-amber-500 hover:bg-amber-500": part.quantity > 0 && part.quantity < 5,
      "bg-green-500 hover:bg-green-500": part.quantity >= 5,
    })}>
      {text}
    </Badge>
  );
};
