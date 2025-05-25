
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Part } from "@/types/parts";

interface PartSelectorProps {
  partsWithCoreCharges: Part[];
  selectedPartId: string;
  onPartSelect: (partId: string) => void;
}

export function PartSelector({ partsWithCoreCharges, selectedPartId, onPartSelect }: PartSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="part-select">Select Part *</Label>
      <Select value={selectedPartId} onValueChange={onPartSelect}>
        <SelectTrigger id="part-select">
          <SelectValue placeholder="Choose a part with core charge..." />
        </SelectTrigger>
        <SelectContent>
          {partsWithCoreCharges.length === 0 ? (
            <SelectItem value="no-parts" disabled>
              No parts with core charges found
            </SelectItem>
          ) : (
            partsWithCoreCharges.map((part) => (
              <SelectItem key={part.id} value={part.id}>
                {part.name} - ${part.core_charge?.toFixed(2)} core charge
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
