
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth'; // Using the correct auth context path
import { Loader2 } from 'lucide-react';

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is already authenticated and has appropriate role
  useEffect(() => {
    if (user) {
      const role = user.app_metadata?.role;
      if (role === 'admin' || role === 'staff') {
        navigate('/shop', { replace: true });
      } else if (role === 'customer') {
        // If customer is trying to access shop login, redirect to customer portal
        toast({
          title: "Access Restricted",
          description: "Customers must use the Customer Portal",
          variant: "destructive",
        });
        navigate('/customer/profile', { replace: true });
      }
    }
  }, [user, navigate, toast]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError(null);
  }, [email, password]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("SignIn: Attempting to sign in with email:", email);
      
      // Sign in using auth context
      await signIn(email, password, rememberMe);
      
      // Navigation will be handled by the auth state listener in AuthProvider
      console.log("SignIn: Sign-in successful");
      
    } catch (error: any) {
      console.error("SignIn error:", error);
      setError(error.message || "An unexpected error occurred");
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      <CardContent className="space-y-4 pt-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input 
            id="signin-email" 
            type="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className={error ? "border-red-300" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signin-password">Password</Label>
          <Input 
            id="signin-password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className={error ? "border-red-300" : ""}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="remember-me" 
            checked={rememberMe} 
            onCheckedChange={(checked) => setRememberMe(!!checked)} 
            disabled={loading}
          />
          <label 
            htmlFor="remember-me"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Remember me
          </label>
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
        
        <div className="text-sm text-center text-gray-500">
          <button
            type="button"
            className="text-primary hover:underline"
            disabled={loading}
            onClick={() => navigate('/shop/reset-password')}
          >
            Forgot password?
          </button>
        </div>
      </CardContent>
    </form>
  );
};

export default SignInForm;
