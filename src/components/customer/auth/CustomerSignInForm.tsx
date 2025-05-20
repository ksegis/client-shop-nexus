
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

const CustomerSignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();

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
    
    try {
      console.log('Customer attempting to sign in with:', email);
      
      // Use the auth context's signIn method
      const { success, error } = await signIn(email, password);
      
      if (!success) {
        throw error || new Error('Sign in failed');
      }
      
      // Success notification and navigation will be handled by the auth context
      
    } catch (error: any) {
      console.error('Customer sign in error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials"
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
  
  const handleForgotPassword = () => {
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address to reset your password"
      });
      return;
    }
    
    navigate('/customer/reset-password', { state: { email } });
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
            Forgot password?
          </Button>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
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
