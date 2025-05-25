
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsCheckboxProps {
  acceptTerms: boolean;
  onTermsChange: (checked: boolean) => void;
}

export function TermsCheckbox({ acceptTerms, onTermsChange }: TermsCheckboxProps) {
  return (
    <div className="flex items-start space-x-2 pt-2">
      <Checkbox 
        id="terms" 
        checked={acceptTerms} 
        onCheckedChange={(checked) => onTermsChange(checked as boolean)}
      />
      <Label htmlFor="terms" className="text-sm leading-tight">
        I confirm that this core part is being returned in the condition stated above and 
        was originally purchased from this shop. *
      </Label>
    </div>
  );
}
