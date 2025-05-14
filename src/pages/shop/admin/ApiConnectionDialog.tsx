
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiConnectionFormData, ApiConnectionType } from './types';
import { useApiConnections } from '@/hooks/useApiConnections';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  key: z.string().min(5, { message: 'API key must be at least 5 characters' }),
  type: z.enum(['zapier', 'n8n', 'ghl', 'webhook', 'other'] as const),
  url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
});

interface ApiConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApiConnectionDialog: React.FC<ApiConnectionDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { createConnection } = useApiConnections();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      key: '',
      type: 'webhook' as ApiConnectionType,
      url: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData: ApiConnectionFormData = {
      name: values.name,
      key: values.key,
      type: values.type as ApiConnectionType,
      url: values.url,
    };

    const success = await createConnection(formData);
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add API Connection</DialogTitle>
          <DialogDescription>
            Create a new API connection for external integrations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Zapier Integration" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name for this connection
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select connection type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="zapier">Zapier</SelectItem>
                      <SelectItem value="n8n">n8n</SelectItem>
                      <SelectItem value="ghl">Go High Level</SelectItem>
                      <SelectItem value="webhook">Generic Webhook</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of integration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="API key or token" {...field} />
                  </FormControl>
                  <FormDescription>
                    The API key or token for this connection
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://hooks.zapier.com/..." {...field} />
                  </FormControl>
                  <FormDescription>
                    URL endpoint for webhook connections
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button type="submit">Add Connection</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
