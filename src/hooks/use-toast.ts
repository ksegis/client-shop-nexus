
import { useEffect, useRef, useState } from "react";
import { toast as sonnerToast, type ToastT, type Toast, type ToastOptions } from "sonner";

// Define ToastProps to extend ToastT but make id optional
export interface ToastProps extends Partial<ToastT> {
  title?: string;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
}

// Modified toast function that adds id if not provided
export const toast = ({ title, description, variant = "default", ...props }: ToastProps) => {
  // Generate a default ID if one isn't provided
  const id = props.id || Math.random().toString(36).substring(2, 9);
  
  return sonnerToast({
    ...props,
    id,
    title,
    description,
    className: variant === "destructive" 
      ? "destructive" 
      : variant === "success" 
        ? "success" 
        : "",
  });
};

// useToast hook returns the toast function
export const useToast = () => {
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Ensure this only runs on the client
  useEffect(() => {
    setMounted(true);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Only return the toast function if we're mounted on the client
  return mounted
    ? {
        toast,
        dismiss: sonnerToast.dismiss,
        error: (message: string) => 
          toast({ variant: "destructive", title: "Error", description: message }),
        success: (message: string) => 
          toast({ variant: "success", title: "Success", description: message }),
      }
    : {
        toast: () => {},
        dismiss: () => {},
        error: () => {},
        success: () => {},
      };
};
