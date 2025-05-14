
import { toast as sonnerToast } from "sonner";
import { ToastActionElement } from "@/components/ui/toast";

type ToastProps = React.ComponentPropsWithoutRef<typeof import("@/components/ui/toast").Toast> & {
  action?: ToastActionElement,
  description?: React.ReactNode;
  title?: React.ReactNode;
};

export const useToast = () => {
  return {
    toast: (props: ToastProps) => {
      sonnerToast(props.title, {
        description: props.description,
        action: props.action,
        // Using consistent props that are compatible with ExternalToast
      });
    },
  };
};

export const toast = (props: ToastProps) => {
  sonnerToast(props.title, {
    description: props.description,
    action: props.action,
    // Using consistent props that are compatible with ExternalToast
  });
};
