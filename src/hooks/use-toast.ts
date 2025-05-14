
import { toast as sonnerToast, useToast as useSonnerToast } from "sonner";
import { ToastActionElement } from "@/components/ui/toast";

type ToastProps = React.ComponentPropsWithoutRef<typeof import("@/components/ui/toast").Toast> & {
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export const useToast = () => {
  return {
    toast: (props: ToastProps) => {
      sonnerToast(props.title, {
        description: props.description,
        action: props.action,
        variant: props.variant as any,
      });
    },
  };
};

export const toast = (props: ToastProps) => {
  sonnerToast(props.title, {
    description: props.description,
    action: props.action,
    variant: props.variant as any,
  });
};
