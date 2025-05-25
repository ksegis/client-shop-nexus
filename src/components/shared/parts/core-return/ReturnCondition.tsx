
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ReturnConditionProps {
  condition: 'new' | 'used' | 'damaged';
  onConditionChange: (condition: 'new' | 'used' | 'damaged') => void;
}

export function ReturnCondition({ condition, onConditionChange }: ReturnConditionProps) {
  return (
    <div className="space-y-2">
      <Label>Part Condition *</Label>
      <RadioGroup 
        value={condition} 
        onValueChange={(value) => onConditionChange(value as 'new' | 'used' | 'damaged')}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="new" id="condition-new" />
          <Label htmlFor="condition-new">New/Like New (100% refund)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="used" id="condition-used" />
          <Label htmlFor="condition-used">Used/Working (75% refund)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="damaged" id="condition-damaged" />
          <Label htmlFor="condition-damaged">Damaged/Partial (25% refund)</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
