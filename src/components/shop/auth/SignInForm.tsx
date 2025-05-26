
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
  rememberMe: z.boolean().default(false),
});

const SignInForm = () => {
  const { signIn, resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    console.log('Attempting to sign in with:', values.email);
    
    try {
      const result = await signIn(values.email, values.password, values.rememberMe);
      
      // If login was not successful, reset password field
      if (!result.success) {
        form.setValue("password", "");
        console.error("Sign in failed:", result.error);
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: result.error?.message || "Authentication error occurred.",
        });
      } else {
        console.log("Sign in successful, redirection should happen in signIn function");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Authentication error occurred.",
      });
      form.setValue("password", "");
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    
    if (!email || !email.trim()) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }

    // Validate email format
    try {
      z.string().email().parse(email);
    } catch {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsResetting(true);
    
    try {
      console.log('Attempting password reset for:', email);
      // The resetPassword function now handles all messaging, including success and error cases
      await resetPassword(email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      // Don't show additional error toast since resetPassword handles messaging
    } finally {
      setIsResetting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="email@example.com" {...field} disabled={isLoading || isResetting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isLoading || isResetting}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                    disabled={isLoading || isResetting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading || isResetting}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Remember me</FormLabel>
              </FormItem>
            )}
          />
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0 font-normal text-blue-500"
              onClick={handlePasswordReset}
              disabled={isResetting || isLoading}
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : "Forgot password?"}
            </Button>
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-2" 
            disabled={isLoading || isResetting}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : "Sign In"}
          </Button>
        </form>
      </Form>
      
      <div className="mt-4 text-center text-sm">
        <p className="text-gray-500">
          Have an invitation? <Link to="/auth/invite" className="text-blue-500 hover:underline">Accept invitation</Link>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
