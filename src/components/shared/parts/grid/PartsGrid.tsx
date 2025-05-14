
import { Part } from '@/types/parts';
import { PartCard } from '../PartCard';

interface PartsGridProps {
  parts: Part[];
  onAddToCart?: (part: Part) => void;
  onViewDetails: (partId: string) => void;
  showInventory?: boolean;
}

export const PartsGrid = ({
  parts,
  onAddToCart,
  onViewDetails,
  showInventory = false
}: PartsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {parts.map(part => (
        <PartCard
          key={part.id}
          part={part}
          onAddToCart={onAddToCart}
          onViewDetails={onViewDetails}
          showInventory={showInventory}
        />
      ))}
    </div>
  );
};
