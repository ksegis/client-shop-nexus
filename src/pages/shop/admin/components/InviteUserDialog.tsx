import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertTriangle, Copy, ExternalLink, Clock, Mail } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['customer', 'staff', 'admin'], {
    required_error: 'Please select a role',
  }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSuccess: () => void;
}

export const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  open,
  onOpenChange,
  onInviteSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{
    success: boolean;
    message: string;
    inviteUrl?: string;
    emailId?: string;
    timestamp?: string;
  } | null>(null);
  const { toast } = useToast();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: undefined,
    },
  });

  const resetDialog = () => {
    form.reset();
    setInviteStatus(null);
  };

  const copyInviteUrl = () => {
    if (inviteStatus?.inviteUrl) {
      navigator.clipboard.writeText(inviteStatus.inviteUrl);
      toast({
        title: 'Copied!',
        description: 'Invitation URL copied to clipboard',
      });
    }
  };

  const onSubmit = async (values: InviteFormValues) => {
    setIsLoading(true);
    setInviteStatus(null);
    
    try {
      console.log('Starting invitation process for:', values.email);

      // Check if user is authenticated first
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        console.error('Authentication error:', authError);
        throw new Error('You must be logged in to send invitations');
      }

      console.log('Current user authenticated:', currentUser.id);

      // Generate invitation token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invite_token');
      
      if (tokenError) {
        console.error('Token generation error:', tokenError);
        throw new Error('Failed to generate invitation token: ' + tokenError.message);
      }

      console.log('Generated token:', tokenData);

      // Create invitation record with pending status
      const { error: inviteError } = await supabase
        .from('shop_invites')
        .insert({
          email: values.email,
          role: values.role,
          token: tokenData,
          invited_by: currentUser.id,
          expires_at: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(), // 36 hours
        });

      if (inviteError) {
        console.error('Database insert error:', inviteError);
        throw new Error('Failed to create invitation record: ' + inviteError.message);
      }

      console.log('Invitation record created, sending email...');

      // Get the current session to ensure we have a valid token for the edge function
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Session expired. Please refresh and try again.');
      }

      // Send invitation email via edge function with proper authentication
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          role: values.role,
          token: tokenData,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Email function response:', emailResponse);
      console.log('Email function error:', emailError);

      const timestamp = new Date().toISOString();

      // Check if there was an error calling the function itself
      if (emailError) {
        console.error('Email function invocation error:', emailError);
        setInviteStatus({
          success: false,
          message: `Failed to send invitation email: ${emailError.message}. Please use the manual link below.`,
          inviteUrl: `https://id-preview--6dd8b04d-be77-46f2-b1a0-1037f4165d18.lovable.app/auth/invite-accept?token=${tokenData}`,
          timestamp
        });
      } else {
        // Function was called successfully, check the response
        if (emailResponse && emailResponse.success) {
          setInviteStatus({
            success: true,
            message: emailResponse.message || `Invitation email sent successfully to ${values.email}`,
            inviteUrl: emailResponse.inviteUrl,
            emailId: emailResponse.messageId,
            timestamp
          });
          onInviteSuccess();
          
          toast({
            title: 'Invitation sent!',
            description: `Email successfully sent to ${values.email}`,
          });
        } else {
          // Function returned but indicated failure
          const errorMessage = emailResponse?.message || 'Failed to send invitation email';
          setInviteStatus({
            success: false,
            message: errorMessage + '. Please use the manual link below.',
            inviteUrl: emailResponse?.inviteUrl || `https://id-preview--6dd8b04d-be77-46f2-b1a0-1037f4165d18.lovable.app/auth/invite-accept?token=${tokenData}`,
            timestamp
          });
        }
      }

    } catch (error: any) {
      console.error('Error in invitation process:', error);
      setInviteStatus({
        success: false,
        message: error.message || 'Failed to create invitation',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invitation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Send an invitation to a new user. They will receive an email with a link to set up their account.
          </DialogDescription>
        </DialogHeader>
        
        {inviteStatus ? (
          <div className="space-y-4">
            <Alert className={inviteStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center space-x-2">
                {inviteStatus.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={inviteStatus.success ? 'text-green-800' : 'text-red-800'}>
                  {inviteStatus.message}
                </AlertDescription>
              </div>
            </Alert>

            {/* Email delivery tracking */}
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Invitation Details</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Time:</strong> {inviteStatus.timestamp ? new Date(inviteStatus.timestamp).toLocaleString() : 'Unknown'}</div>
                {inviteStatus.emailId && (
                  <div><strong>Email ID:</strong> {inviteStatus.emailId}</div>
                )}
                <div><strong>Status:</strong> {inviteStatus.success ? 'Email sent successfully' : 'Email delivery failed'}</div>
              </div>
            </div>

            {inviteStatus.inviteUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Manual Invitation Link</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={inviteStatus.inviteUrl} 
                    readOnly 
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyInviteUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(inviteStatus.inviteUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {inviteStatus.success 
                    ? 'Backup link in case the user needs it again.' 
                    : 'Share this link securely with the user since email delivery failed.'}
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetDialog();
                  setInviteStatus(null);
                }}
              >
                Send Another Invitation
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
