
import { useState, useEffect, useCallback } from "react";
import { Toaster as Sonner } from "sonner";

type ToastProps = React.ComponentProps<typeof Sonner>;

export const useToast = () => {
  const [toasts, setToasts] = useState<any[]>([]);

  const toast = useCallback(({ ...props }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...props }]);
    return id;
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    setToasts((prev) =>
      toastId
        ? prev.filter((toast) => toast.id !== toastId)
        : []
    );
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
};

export { toast } from "sonner";
