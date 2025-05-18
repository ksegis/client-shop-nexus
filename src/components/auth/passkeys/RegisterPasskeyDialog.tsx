
import { useState } from 'react';
import { webAuthnService } from '@/services/auth/webauthn';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Key, Loader2 } from 'lucide-react';

// Form schema
const formSchema = z.object({
  deviceName: z.string().min(1, 'Device name is required')
    .max(64, 'Device name cannot exceed 64 characters')
});

type RegisterPasskeyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
};

export function RegisterPasskeyDialog({ 
  open, 
  onOpenChange, 
  userId, 
  onSuccess 
}: RegisterPasskeyDialogProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceName: ''
    }
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsRegistering(true);
    
    try {
      const success = await webAuthnService.registerCredential(
        userId,
        values.deviceName
      );
      
      if (success) {
        form.reset();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        form.setError('root', { 
          message: 'Failed to register security key. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Error registering security key:', error);
      form.setError('root', { 
        message: 'An error occurred while registering your security key.' 
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <span>Register Security Key</span>
          </DialogTitle>
          <DialogDescription>
            Add a security key or passkey to secure your account
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., My Phone, Work Laptop" 
                      {...field} 
                      disabled={isRegistering}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.formState.errors.root && (
              <div className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={isRegistering}
                className="flex items-center gap-2"
              >
                {isRegistering && <Loader2 className="h-4 w-4 animate-spin" />}
                {isRegistering ? 'Registering...' : 'Register Key'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
