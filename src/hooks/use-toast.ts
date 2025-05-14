
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  // Allow other props from sonner to be passed through
  [key: string]: any;
};

// Create a hook to maintain API compatibility
export const useToast = () => {
  return {
    toast: (props: ToastProps) => toast(props)
  };
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
