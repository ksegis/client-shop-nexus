
"use client";

import { toast as sonnerToast, type ToastT } from "sonner";

// Extended toast interface that includes variant
export type ToastProps = Partial<ToastT> & {
  variant?: "default" | "destructive";
};

// Utility function to map our custom variants to Sonner toast types
const mapVariantToType = (variant: ToastProps['variant']) => {
  if (variant === 'destructive') return 'error';
  return 'default';
};

export function toast(props: ToastProps) {
  const { title, description, variant, ...rest } = props;
  
  return sonnerToast(title as string, {
    description,
    // Map our variant to Sonner type
    type: variant ? mapVariantToType(variant) : undefined,
    ...rest,
  });
}

// Create a separate hook for useToast to avoid circular references
export function useToast() {
  return { toast };
}
