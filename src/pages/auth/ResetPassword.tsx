
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Password requirements schema
const passwordResetSchema = z.object({
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

type FormValues = z.infer<typeof passwordResetSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Check if we have valid reset tokens in the URL
  useEffect(() => {
    const checkTokens = async () => {
      console.log('=== RESET PASSWORD PAGE DEBUG ===');
      console.log('Current URL:', window.location.href);
      console.log('Search params:', Object.fromEntries(searchParams.entries()));
      
      // Check for the token and type parameters that Supabase sends
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      console.log('Token:', token);
      console.log('Type:', type);
      console.log('Access Token:', accessToken);
      console.log('Refresh Token:', refreshToken);
      
      // If we have access_token and refresh_token, use them directly
      if (accessToken && refreshToken) {
        console.log('Using access_token and refresh_token from URL');
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            toast({
              title: "Invalid reset link",
              description: "This password reset link is invalid or has expired.",
              variant: "destructive",
            });
            navigate('/shop-login');
          } else {
            console.log('Session set successfully:', data);
            setValidToken(true);
          }
        } catch (error) {
          console.error('Error in setSession:', error);
          toast({
            title: "Invalid reset link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/shop-login');
        }
      }
      // If we have token and type=recovery, try to exchange for session
      else if (token && type === 'recovery') {
        console.log('Using token and type=recovery from URL');
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          
          if (error) {
            console.error('Error verifying recovery token:', error);
            toast({
              title: "Invalid reset link",
              description: "This password reset link is invalid or has expired.",
              variant: "destructive",
            });
            navigate('/shop-login');
          } else {
            console.log('Recovery token verified successfully:', data);
            setValidToken(true);
          }
        } catch (error) {
          console.error('Error in verifyOtp:', error);
          toast({
            title: "Invalid reset link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/shop-login');
        }
      } else {
        console.log('No valid tokens found in URL');
        toast({
          title: "Invalid reset link",
          description: "This password reset link is invalid or has expired.",
          variant: "destructive",
        });
        navigate('/shop-login');
      }
    };
    
    checkTokens();
  }, [searchParams, toast, navigate]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      console.log('Updating password...');
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      console.log('Password updated successfully');
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated. You can now sign in with your new password.",
      });

      // Sign out the user and redirect to login
      await supabase.auth.signOut();
      navigate('/shop-login');
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying reset link...</CardTitle>
            <CardDescription>Please wait while we verify your password reset link.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your new password" {...field} />
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
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating password..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Having trouble? Contact support for assistance.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
