
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toast } = useToast()

  // Since our custom useToast doesn't have a toasts array like Radix UI's original useToast,
  // we'll need to modify this component to not rely on that.
  // For now, since the Sonner toaster is actually handling the toast rendering,
  // we can return an empty provider.
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}
