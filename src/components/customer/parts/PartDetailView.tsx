
import { CustomerPartDetail } from './detail';
import { Part } from "@/types/parts";

interface PartDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPart: Part | null;
  onAddToCart: (part: Part, quantity: number) => void;
}

export function PartDetailView({
  isOpen,
  onClose,
  selectedPart,
  onAddToCart
}: PartDetailViewProps) {
  return (
    <CustomerPartDetail
      isOpen={isOpen}
      onClose={onClose}
      selectedPart={selectedPart}
      onAddToCart={onAddToCart}
    />
  );
}
