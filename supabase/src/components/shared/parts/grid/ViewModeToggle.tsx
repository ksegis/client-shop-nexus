
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, LayoutList } from "lucide-react";

interface ViewModeToggleProps {
  viewMode: 'grid' | 'table';
  onViewModeChange: (value: 'grid' | 'table') => void;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  const handleValueChange = (value: string) => {
    if (value === 'grid' || value === 'table') {
      onViewModeChange(value);
    }
  };

  return (
    <ToggleGroup type="single" value={viewMode} onValueChange={handleValueChange}>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid className="h-4 w-4 mr-2" />
        <span className="sr-only sm:not-sr-only sm:inline-block">Grid</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view">
        <LayoutList className="h-4 w-4 mr-2" />
        <span className="sr-only sm:not-sr-only sm:inline-block">Table</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
