
import { toast as sonnerToast, type Toast as SonnerToast } from "sonner"

type ToastProps = SonnerToast & {
  variant?: "default" | "destructive" | "success"
}

export function toast({ variant = "default", ...props }: ToastProps) {
  const variantClassNames = {
    default: "",
    destructive: "bg-destructive text-destructive-foreground",
    success: "bg-green-500 text-white",
  }

  return sonnerToast(props.title, {
    ...props,
    classNames: {
      toast: `${variantClassNames[variant]}`,
    },
  })
}

export { useToast } from "sonner"
