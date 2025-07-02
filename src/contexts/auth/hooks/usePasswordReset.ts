
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from './useRateLimit';

export function usePasswordReset() {
  const { toast } = useToast();
  const { checkRateLimit } = useRateLimit();

  const resetPassword = async (email) => {
    try {
      console.log('=== PASSWORD RESET DEBUG START ===');
      console.log('Email requested for reset:', email);
      console.log('Current timestamp:', new Date().toISOString());
      
      // Check rate limiting
      if (!checkRateLimit(email)) {
        console.log('Rate limit exceeded for email:', email);
        toast({
          variant: "destructive",
          title: "Too many requests",
          description: "Please wait 15 minutes before requesting another password reset."
        });
        return { success: false, error: new Error('Rate limit exceeded') };
      }
      
      // Use the correct redirect URL that points directly to the change password page
      const redirectTo = `${window.location.origin}/auth/change-password`;
      console.log('Redirect URL configured:', redirectTo);
      console.log('Window location origin:', window.location.origin);
      
      console.log('Calling Supabase resetPasswordForEmail...');
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });
      
      console.log('Supabase response data:', data);
      console.log('Supabase response error:', error);
      
      // Try to send custom password reset email via our edge function
      try {
        const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-password-reset', {
          body: {
            email,
            resetUrl: `${redirectTo}?email=${encodeURIComponent(email)}`
          }
        });
        
        if (emailError) {
          console.warn('Custom email service failed, falling back to Supabase default:', emailError);
        } else {
          console.log('Custom password reset email sent:', emailResponse);
        }
      } catch (customEmailError) {
        console.warn('Custom email service unavailable, using Supabase default:', customEmailError);
      }
      
      // Always show success message for security (don't reveal if email exists)
      toast({
        title: "Password reset requested",
        description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your inbox and spam folder."
      });
      
      if (error) {
        console.error('Supabase resetPasswordForEmail error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        // Don't throw error to user - always show success message for security
      }
      
      console.log('Password reset request completed');
      console.log('=== PASSWORD RESET DEBUG END ===');
      
      // Always return success to prevent email enumeration
      return { success: true };
    } catch (error) {
      console.error('=== PASSWORD RESET ERROR ===');
      console.error('Password reset error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor.name);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('=== PASSWORD RESET ERROR END ===');
      
      // Still show success message for security
      toast({
        title: "Password reset requested",
        description: "If your email address is registered with us, you will receive password reset instructions within a few minutes. Please check your inbox and spam folder."
      });
      
      return { success: true }; // Always return success for security
    }
  };

  return { resetPassword };
}
