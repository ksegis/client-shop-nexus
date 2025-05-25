
import { Part } from "@/types/parts";

interface PartDetailsProps {
  selectedPart: Part;
}

export function PartDetails({ selectedPart }: PartDetailsProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{selectedPart.name}</h3>
      <p className="text-sm text-muted-foreground">
        SKU: {selectedPart.sku}
      </p>
      <p className="text-sm text-muted-foreground">
        Original core charge: ${selectedPart.core_charge?.toFixed(2) || '0.00'}
      </p>
    </div>
  );
}
