import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth'; 
import { Loader2 } from 'lucide-react';
import { useAuthFlowLogs } from '@/hooks/useAuthFlowLogs';

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { signIn, user, portalType } = useAuth();
  const navigate = useNavigate();
  const { logAuthFlowEvent } = useAuthFlowLogs();
  
  // Log component mount
  useEffect(() => {
    logAuthFlowEvent({
      event_type: 'shop_signin_form_mounted',
      user_id: user?.id,
      email: user?.email,
      user_role: user?.user_metadata?.role,
      details: {
        isAlreadyAuthenticated: !!user,
        portalType
      }
    });
  }, []);
  
  // Check if user is already authenticated and has appropriate role
  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role;
      
      logAuthFlowEvent({
        event_type: 'shop_signin_authenticated_check',
        user_id: user?.id,
        email: user?.email,
        user_role: role,
        details: {
          role,
          portalType,
          location: window.location.pathname
        }
      });
      
      if (role === 'admin' || role === 'staff') {
        logAuthFlowEvent({
          event_type: 'shop_signin_redirect_to_shop',
          user_id: user?.id,
          email: user?.email,
          user_role: role
        });
        
        // Increased timeout from 100ms to 800ms
        const timer = setTimeout(() => {
          navigate('/shop', { replace: true });
        }, 800);
        
        return () => clearTimeout(timer);
      } else if (role === 'customer') {
        logAuthFlowEvent({
          event_type: 'shop_signin_customer_access_denied',
          user_id: user?.id,
          email: user?.email,
          user_role: role
        });
        
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
      logAuthFlowEvent({
        event_type: 'shop_signin_attempt',
        email,
        details: {
          rememberMe
        }
      });
      
      console.log("SignIn: Attempting to sign in with email:", email);
      
      // Sign in using auth context - now using rememberMe as a boolean
      const result = await signIn(email, password, rememberMe);
      
      if (result.success) {
        logAuthFlowEvent({
          event_type: 'shop_signin_success',
          email,
          user_id: result.data?.user?.id,
          user_role: result.data?.user?.user_metadata?.role
        });
        
        console.log("SignIn: Sign-in successful, redirecting...");
        
        // Increased timeout from 300ms to 1000ms
        setTimeout(() => {
          navigate('/shop', { replace: true });
        }, 1000);
      }
      
    } catch (error: any) {
      logAuthFlowEvent({
        event_type: 'shop_signin_error',
        email,
        details: {
          error: error.message || "Unknown error"
        }
      });
      
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
