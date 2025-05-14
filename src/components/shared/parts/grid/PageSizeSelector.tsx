
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export const PageSizeSelector = ({
  pageSize,
  onPageSizeChange
}: PageSizeSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="pageSize" className="text-sm">Show</Label>
      <Select
        value={pageSize.toString()}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger className="w-[70px]" id="pageSize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="12">12</SelectItem>
          <SelectItem value="24">24</SelectItem>
          <SelectItem value="48">48</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
