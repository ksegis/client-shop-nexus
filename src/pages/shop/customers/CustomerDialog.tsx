import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCustomers } from './CustomersContext';
import { Plus } from 'lucide-react';

const formSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomerDialogProps {
  customerId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomerDialog({ customerId, open, onOpenChange }: CustomerDialogProps) {
  const { customers, createCustomer, updateCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!customerId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    },
  });

  // Load customer data if editing
  useEffect(() => {
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        form.reset({
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          email: customer.email || '',
          phone: customer.phone || '',
        });
      }
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
      });
    }
  }, [customerId, customers, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      if (isEditing && customerId) {
        await updateCustomer(customerId, values);
      } else {
        await createCustomer(values);
      }
      setIsSubmitting(false);
      form.reset();
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      setIsSubmitting(false);
      console.error(error);
    }
  };

  const DialogComponent = (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        <DialogDescription>
          {isEditing ? 'Update customer information' : 'Fill in the information to add a new customer'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="customer@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 555-5555" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : isEditing ? 'Save Changes' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );

  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {DialogComponent}
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </DialogTrigger>
      {DialogComponent}
    </Dialog>
  );
}
