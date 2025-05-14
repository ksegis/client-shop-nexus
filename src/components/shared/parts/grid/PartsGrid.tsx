
import { Part } from '@/types/parts';
import { PartCard } from '../PartCard';

interface PartsGridProps {
  parts: Part[];
  onAddToCart?: (part: Part) => void;
  onAddToQuotation?: (part: Part) => void;
  onViewDetails: (partId: string) => void;
  onOpenCoreReturn?: (part: Part) => void;
  showInventory?: boolean;
}

export const PartsGrid = ({ 
  parts, 
  onAddToCart,
  onAddToQuotation,
  onViewDetails,
  onOpenCoreReturn,
  showInventory = false
}: PartsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {parts.map((part) => (
        <PartCard
          key={part.id}
          part={part}
          onAddToCart={onAddToCart}
          onAddToQuotation={onAddToQuotation}
          onViewDetails={onViewDetails}
          onOpenCoreReturn={onOpenCoreReturn}
          showInventory={showInventory}
        />
      ))}
    </div>
  );
};
