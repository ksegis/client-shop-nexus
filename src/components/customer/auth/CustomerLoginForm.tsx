
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface CustomerLoginFormProps {
  onResetPassword: () => void;
  onEmailChange?: (email: string) => void;
}

const CustomerLoginForm = ({ onResetPassword, onEmailChange }: CustomerLoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user is already authenticated with an inappropriate role
  useEffect(() => {
    if (user) {
      const role = user.app_metadata?.role;
      if (role === 'admin' || role === 'staff') {
        // Staff/admin trying to access customer login - redirect to shop portal
        toast({
          title: "Access Restricted",
          description: "Staff members must use the Shop Management Portal",
        });
        navigate('/shop', { replace: true });
      } else if (role === 'customer') {
        // Customer already logged in
        navigate('/customer/profile', { replace: true });
      }
    }
  }, [user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await signIn(email, password);
      // The redirect will happen automatically based on role in AuthProvider
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (onEmailChange) {
      onEmailChange(newEmail);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email" 
          placeholder="your@email.com"
          value={email}
          onChange={handleEmailChange}
          required
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Button 
            variant="link" 
            className="p-0 h-auto text-xs text-shop-primary"
            type="button"
            onClick={onResetPassword}
          >
            Forgot password?
          </Button>
        </div>
        
        <Input
          id="password"
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full"
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
            Signing in...
          </>
        ) : 'Sign In'}
      </Button>
    </form>
  );
};

export default CustomerLoginForm;
