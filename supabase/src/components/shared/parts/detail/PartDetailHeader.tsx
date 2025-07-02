
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Part } from "@/types/parts";

interface PartDetailHeaderProps {
  part: Part | null;
  isLoading: boolean;
  hideSku?: boolean;
}

export function PartDetailHeader({ part, isLoading, hideSku = false }: PartDetailHeaderProps) {
  if (isLoading) {
    return (
      <DialogHeader>
        <DialogTitle>Loading part details...</DialogTitle>
      </DialogHeader>
    );
  }
  
  if (!part) {
    return (
      <DialogHeader>
        <DialogTitle>Part not found</DialogTitle>
        <DialogDescription>
          The requested part could not be found in inventory.
        </DialogDescription>
      </DialogHeader>
    );
  }
  
  return (
    <DialogHeader>
      <DialogTitle>{part.name}</DialogTitle>
      <DialogDescription>
        {!hideSku && part.sku && `SKU: ${part.sku}`}
        {!hideSku && part.sku && part.category && ` • `}
        {part.category && part.category}
      </DialogDescription>
    </DialogHeader>
  );
}
