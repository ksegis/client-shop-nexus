import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseAuth } from '@/contexts/auth/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase';
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
  const { updatePassword } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  // Check if we have valid reset tokens directly from the URL
  useEffect(() => {
    const checkTokens = async () => {
      console.log('[Supabase Auth] Reset password page - checking tokens from URL');
      console.log('Current URL:', window.location.href);
      console.log('Search params:', Object.fromEntries(searchParams.entries()));
      
      try {
        // Get tokens directly from URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        console.log('[Supabase Auth] URL tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
        
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('[Supabase Auth] Setting session with URL tokens');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('[Supabase Auth] Error setting session:', error);
            toast({
              title: "Invalid reset link",
              description: "This password reset link is invalid or has expired.",
              variant: "destructive",
            });
            navigate('/shop-login');
          } else {
            console.log('[Supabase Auth] Session set successfully for password reset');
            setValidToken(true);
          }
        } else {
          console.log('[Supabase Auth] No valid reset tokens found in URL');
          toast({
            title: "Invalid reset link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/shop-login');
        }
      } catch (error) {
        console.error('[Supabase Auth] Error in token check:', error);
        toast({
          title: "Invalid reset link",
          description: "This password reset link is invalid or has expired.",
          variant: "destructive",
        });
        navigate('/shop-login');
      } finally {
        setCheckingToken(false);
      }
    };
    
    checkTokens();
  }, [searchParams, toast, navigate]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      console.log('[Supabase Auth] Updating password...');
      const result = await updatePassword(values.password);

      if (result.success) {
        console.log('[Supabase Auth] Password updated successfully');
        // Navigation is handled by the updatePassword function
      } else {
        console.error('[Supabase Auth] Password update failed:', result.error);
      }
    } catch (error: any) {
      console.error('[Supabase Auth] Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
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

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>This password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/shop-login')} className="w-full">
              Return to Login
            </Button>
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
