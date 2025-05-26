
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { z } from 'zod';

const CustomerSignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, resetPassword } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent multiple submissions
    
    if (!email.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Email and password are required"
      });
      return;
    }
    
    setLoading(true);
    console.log('Customer attempting to sign in with:', email);
    
    try {
      const result = await signIn(email, password);
      
      if (!result.success) {
        console.error('Customer sign in failed:', result.error);
        // Clear password on error
        setPassword('');
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.error?.message || "Authentication failed"
        });
      } else {
        console.log('Customer sign in successful, redirection should occur in signIn function');
      }
    } catch (error: any) {
      console.error('Customer sign in error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Authentication failed"
      });
      // Clear password on error
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleForgotPassword = async () => {
    if (!email || !email.trim()) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to reset your password"
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
        description: "Please enter a valid email address."
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting password reset for:', email);
      const result = await resetPassword(email);
      
      if (result.success) {
        toast({
          title: "Password reset email sent",
          description: "Check your email for instructions to reset your password.",
        });
      } else {
        throw result.error || new Error('Password reset failed');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message || "Failed to send password reset email"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="customer-signin-email">Email</Label>
          <Input 
            id="customer-signin-email" 
            type="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-signin-password">Password</Label>
          <div className="relative">
            <Input 
              id="customer-signin-password" 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="link" 
            type="button" 
            className="p-0 h-auto text-sm"
            onClick={handleForgotPassword}
            disabled={loading}
          >
            {loading ? (
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
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : "Sign In"}
        </Button>
      </CardContent>
    </form>
  );
};

export default CustomerSignInForm;
