
import { PageSizeSelector } from './PageSizeSelector';

interface PartsGridHeaderProps {
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export const PartsGridHeader = ({
  totalItems,
  startIndex,
  endIndex,
  pageSize,
  onPageSizeChange
}: PartsGridHeaderProps) => {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} parts
      </p>
      
      <div className="flex items-center gap-4">
        <PageSizeSelector 
          pageSize={pageSize} 
          onPageSizeChange={onPageSizeChange} 
        />
      </div>
    </div>
  );
};
