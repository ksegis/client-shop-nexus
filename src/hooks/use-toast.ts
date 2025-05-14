
import { toast as sonnerToast, useToast as useSonnerToast } from "sonner";

type ToastProps = Parameters<typeof sonnerToast>[0] & {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const useToast = () => {
  return useSonnerToast();
};

export const toast = ({ 
  title, 
  description, 
  variant = "default", 
  ...props 
}: ToastProps) => {
  return sonnerToast(title, {
    description,
    ...props,
  });
};
