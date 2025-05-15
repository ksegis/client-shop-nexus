
import { toast as sonnerToast } from "sonner";

export type ToastProps = React.ComponentPropsWithoutRef<typeof sonnerToast>;

export function toast(props: ToastProps) {
  sonnerToast(props);
}

export function useToast() {
  return {
    toast,
  };
}
