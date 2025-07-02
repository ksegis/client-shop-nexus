
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Estimate } from "../../estimates/types";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface EstimateSelectorProps {
  openEstimates: Estimate[];
  sourceEstimateId: string | null;
  onEstimateSelected: (estimateId: string) => void;
}

export function EstimateSelector({ 
  openEstimates = [], 
  sourceEstimateId, 
  onEstimateSelected 
}: EstimateSelectorProps) {
  const [estimateSelectOpen, setEstimateSelectOpen] = useState(false);
  const { toast } = useToast();

  // Ensure estimates is always a valid array to prevent "undefined is not iterable" error
  const estimates = Array.isArray(openEstimates) ? openEstimates : [];

  const handleEstimateSelection = (estimateId: string) => {
    onEstimateSelected(estimateId);
    setEstimateSelectOpen(false);
    toast({
      title: "Estimate Selected",
      description: "Invoice details populated from estimate",
    });
  };

  if (estimates.length === 0) {
    return null;
  }

  // Find the selected estimate safely
  const selectedEstimate = sourceEstimateId 
    ? estimates.find(est => est.id === sourceEstimateId)
    : undefined;

  return (
    <div className="space-y-2">
      <FormLabel>Reference Estimate (Optional)</FormLabel>
      <Popover open={estimateSelectOpen} onOpenChange={setEstimateSelectOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={estimateSelectOpen}
            className="w-full justify-between"
          >
            {sourceEstimateId && selectedEstimate
              ? `${selectedEstimate.title || 'Selected estimate'} (#${sourceEstimateId.substring(0, 8)})`
              : "Select an estimate..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0">
          <Command>
            <CommandInput placeholder="Search estimates..." />
            <CommandEmpty>No estimates found.</CommandEmpty>
            <CommandGroup>
              {estimates.map((estimate) => (
                <CommandItem
                  key={estimate.id}
                  onSelect={() => handleEstimateSelection(estimate.id)}
                  className="flex flex-col items-start py-3"
                >
                  <div className="flex w-full justify-between">
                    <div className="font-medium">{estimate.title || 'Untitled Estimate'}</div>
                    <div className="text-muted-foreground text-sm">
                      {formatCurrency(estimate.total_amount)}
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                    <div>
                      {estimate.profiles 
                        ? `${estimate.profiles.first_name || ''} ${estimate.profiles.last_name || ''}`.trim() || estimate.profiles.email 
                        : 'Unknown customer'}
                    </div>
                    <div>
                      {estimate.vehicles 
                        ? `${estimate.vehicles.year || ''} ${estimate.vehicles.make || ''} ${estimate.vehicles.model || ''}`.trim() || 'Vehicle details unavailable'
                        : 'Unknown vehicle'}
                    </div>
                  </div>
                  {sourceEstimateId === estimate.id && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
