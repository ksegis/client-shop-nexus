
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  cancel?: React.ReactNode;
  duration?: number;
};

export function toast({
  title,
  description,
  action,
  cancel,
  duration,
  ...props
}: ToastProps) {
  sonnerToast(title, {
    description,
    action,
    cancel,
    duration,
    ...props,
  });
}

export { toast };
export { useToast } from "sonner";
