
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpecialOrderForm } from './SpecialOrderForm';
import { useSpecialOrder, SpecialOrderFormData } from '@/hooks/parts/useSpecialOrder';

interface SpecialOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpecialOrderDialog({ open, onOpenChange }: SpecialOrderDialogProps) {
  const { createSpecialOrder, isSubmitting } = useSpecialOrder();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: SpecialOrderFormData) => {
    const result = await createSpecialOrder(data);
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Request Special Order Part</DialogTitle>
          <DialogDescription>
            Can't find the part you need? Fill out this form and our parts specialists will source it for you.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
              <h3 className="font-medium text-lg">Special Order Requested!</h3>
              <p>Our parts team will contact you with sourcing information.</p>
            </div>
          </div>
        ) : (
          <SpecialOrderForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}
      </DialogContent>
    </Dialog>
  );
}
