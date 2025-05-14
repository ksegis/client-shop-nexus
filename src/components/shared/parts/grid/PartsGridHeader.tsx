
import { PageSizeSelector } from './PageSizeSelector';
import { ViewModeToggle } from './ViewModeToggle';

interface PartsGridHeaderProps {
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pageSize: number;
  viewMode?: 'grid' | 'table';
  onPageSizeChange: (size: number) => void;
  onViewModeChange?: (mode: 'grid' | 'table') => void;
}

export const PartsGridHeader = ({
  totalItems,
  startIndex,
  endIndex,
  pageSize,
  viewMode = 'grid',
  onPageSizeChange,
  onViewModeChange
}: PartsGridHeaderProps) => {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} parts
      </p>
      
      <div className="flex items-center gap-4">
        {onViewModeChange && (
          <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        )}
        <PageSizeSelector 
          pageSize={pageSize} 
          onPageSizeChange={onPageSizeChange} 
        />
      </div>
    </div>
  );
};
