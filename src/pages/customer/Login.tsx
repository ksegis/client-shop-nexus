
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import CustomerLoginHeader from '@/components/customer/auth/CustomerLoginHeader';
import CustomerLoginForm from '@/components/customer/auth/CustomerLoginForm';
import SocialLoginOptions from '@/components/customer/auth/SocialLoginOptions';
import PasswordResetForm from '@/components/customer/auth/PasswordResetForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const CustomerLogin = () => {
  const [showResetForm, setShowResetForm] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [inPasswordResetMode, setInPasswordResetMode] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Check for reset parameter or recovery hash in URL
  useEffect(() => {
    // Check if we're in password reset mode based on URL params
    if (searchParams.get('reset') === 'true') {
      setInPasswordResetMode(true);
    }
    
    // Check for password reset hash/token in the URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setInPasswordResetMode(true);
      // Extract token from hash if present
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        console.log("Password recovery token detected in URL");
      }
    }
  }, [searchParams]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/customer/profile');
    }
  }, [user, navigate]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter a new password.",
      });
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({
        title: "Password Updated",
        description: "Your password has been reset successfully. You can now sign in with your new password.",
      });
      
      setInPasswordResetMode(false);
      setNewPassword('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "There was a problem resetting your password.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (inPasswordResetMode) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Card className="w-full max-w-md p-6 shadow-md">
          <CustomerLoginHeader />
          <h2 className="text-xl font-bold text-center mb-6">Reset Your Password</h2>
          
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-shop-primary hover:bg-shop-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : 'Reset Password'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setInPasswordResetMode(false)}
            >
              Back to Login
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
      <Card className="w-full max-w-md p-6 shadow-md">
        <CustomerLoginHeader />
        
        {showResetForm ? (
          <PasswordResetForm 
            email={email}
            onCancel={() => setShowResetForm(false)} 
          />
        ) : (
          <>
            <CustomerLoginForm 
              onResetPassword={() => setShowResetForm(true)} 
              onEmailChange={setEmail}
            />
            <SocialLoginOptions />
          </>
        )}
      </Card>
    </div>
  );
};

export default CustomerLogin;
