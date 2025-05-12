
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PasswordResetFormProps {
  email: string;
  onCancel: () => void;
}

const PasswordResetForm = ({ email, onCancel }: PasswordResetFormProps) => {
  const [resetEmail, setResetEmail] = useState(email);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a link to reset your password.",
      });
      
      onCancel(); // Return to login form after successful reset request
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message || "Failed to send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
        <Input
          id="reset-email"
          type="email" 
          placeholder="your@email.com"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          required
          className="w-full"
        />
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="submit"
          className="flex-1 bg-shop-primary hover:bg-shop-primary/90"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : 'Send Reset Link'}
        </Button>
        
        <Button 
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Back to Login
        </Button>
      </div>
    </form>
  );
};

export default PasswordResetForm;
