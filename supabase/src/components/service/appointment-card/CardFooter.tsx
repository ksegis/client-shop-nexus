
import { Button } from '@/components/ui/button';
import { CardFooter as UICardFooter } from '@/components/ui/card';

interface CardFooterProps {
  canCancel: boolean;
  onCancel: () => void;
}

export const CardFooter = ({ canCancel, onCancel }: CardFooterProps) => {
  if (!canCancel) {
    return null;
  }
  
  return (
    <UICardFooter className="pt-3">
      <Button 
        variant="outline" 
        onClick={onCancel}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        Cancel Appointment
      </Button>
    </UICardFooter>
  );
};
