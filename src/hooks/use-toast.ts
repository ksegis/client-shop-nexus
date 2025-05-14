
import { toast as sonnerToast } from "sonner";
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
        // Remove the variant property as it doesn't exist in ExternalToast
      });
    },
  };
};

export const toast = (props: ToastProps) => {
  sonnerToast(props.title, {
    description: props.description,
    action: props.action,
    // Remove the variant property as it doesn't exist in ExternalToast
  });
};
