
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const toast = ({ title, description, variant, ...props }: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      ...props
    });
  }
  
  return sonnerToast(title || "", {
    description,
    ...props
  });
};

export const useToast = () => {
  return {
    toast
  };
};
