
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileMenuButtonProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

export const MobileMenuButton = ({ isOpen, toggleMenu }: MobileMenuButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="md:hidden rounded-full p-2"
      onClick={toggleMenu}
    >
      {isOpen ? (
        <X className="h-5 w-5 text-shop-primary" />
      ) : (
        <Menu className="h-5 w-5 text-shop-primary" />
      )}
    </Button>
  );
};
