
import React from 'react';
import { useForm } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Phone } from 'lucide-react';
import { FormValues } from './types';

interface ContactInfoSectionProps {
  form: ReturnType<typeof useForm<FormValues>>;
  customerContact: { email: string; phone: string | null };
  overrideContact: boolean;
  onOverrideContactChange: (checked: boolean) => void;
}

const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({ 
  form, 
  customerContact, 
  overrideContact, 
  onOverrideContactChange 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Contact Information</h3>
      
      <FormField
        control={form.control}
        name="override_contact"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  onOverrideContactChange(checked as boolean);
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Override contact information</FormLabel>
            </div>
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email for confirmation</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Email address"
                    disabled={!overrideContact && !!customerContact.email}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number (optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Phone number"
                    disabled={!overrideContact && !!customerContact.phone}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default ContactInfoSection;
