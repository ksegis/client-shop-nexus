
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Password requirements schema
const passwordSchema = z.object({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type FormValues = z.infer<typeof passwordSchema>;

const InviteAccept = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<{
    email: string;
    token: string;
    valid: boolean;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Validate invitation token
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      toast({
        title: "Invalid invitation",
        description: "No invitation token provided",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    const verifyToken = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('shop_invites')
          .select('email, token, expires_at')
          .eq('token', token)
          .is('used_at', null)
          .single();
        
        if (error || !data) {
          toast({
            title: "Invalid invitation",
            description: "This invitation link is invalid or has expired",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // Check if invitation has expired
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          toast({
            title: "Invitation expired",
            description: "This invitation link has expired",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setInviteData({
          email: data.email,
          token: data.token,
          valid: true
        });
      } catch (error) {
        console.error("Error verifying invitation token:", error);
        toast({
          title: "Error",
          description: "Failed to verify invitation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, toast, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!inviteData?.valid) return;
    
    setLoading(true);
    try {
      // First check if we can sign in with the invite email
      const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
        email: inviteData.email,
        password: values.password,
      });

      if (userError?.message === "Invalid login credentials" || !userData.user) {
        // If login failed because user doesn't exist, sign them up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: inviteData.email,
          password: values.password,
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error("Failed to create account");
      }

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from('shop_invites')
        .update({ used_at: new Date().toISOString() })
        .eq('token', inviteData.token);
      
      if (updateError) {
        console.error("Error updating invitation status:", updateError);
      }

      toast({
        title: "Account setup complete",
        description: "You can now log in with your credentials",
      });

      // Redirect to login page
      navigate('/shop-login');
    } catch (error: any) {
      console.error("Error setting up account:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying invitation...</CardTitle>
            <CardDescription>Please wait while we verify your invitation.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData?.valid) {
    return null; // We'll be redirected by the useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join the platform. Set your password to complete your account setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm text-blue-700">
              <strong>Email:</strong> {inviteData.email}
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Setting up account..." : "Set Password & Continue"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Already have an account? <a href="/shop-login" className="text-blue-600 hover:underline">Sign in</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InviteAccept;
