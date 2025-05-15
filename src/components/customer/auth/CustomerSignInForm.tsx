
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth'; 
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerSignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Clear error when inputs change
  const handleInputChange = () => {
    if (error) setError(null);
  };

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
      console.log("CustomerSignIn: Attempting to sign in with email:", email);
      
      // Sign in using auth context
      const result = await signIn(email, password, rememberMe);
      
      if (result.success) {
        console.log("CustomerSignIn: Sign-in successful");
        toast({
          title: "Login successful",
          description: "Redirecting to customer portal..."
        });
        
        // Force redirect to customer dashboard
        // This serves as a backup in case the useRedirection hook doesn't trigger
        setTimeout(() => {
          navigate('/customer', { replace: true });
        }, 500);
      } else {
        throw new Error(result.error?.message || "Failed to sign in");
      }
      
    } catch (error: any) {
      console.error("CustomerSignIn error:", error);
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
          <Label htmlFor="customer-signin-email">Email</Label>
          <Input 
            id="customer-signin-email" 
            type="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              handleInputChange();
            }}
            required
            disabled={loading}
            className={error ? "border-red-300" : ""}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer-signin-password">Password</Label>
          <Input 
            id="customer-signin-password" 
            type="password" 
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              handleInputChange();
            }}
            required
            disabled={loading}
            className={error ? "border-red-300" : ""}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="customer-remember-me" 
            checked={rememberMe} 
            onCheckedChange={(checked) => setRememberMe(!!checked)} 
            disabled={loading}
          />
          <label 
            htmlFor="customer-remember-me"
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
            onClick={() => window.location.href = '/customer/reset-password'}
          >
            Forgot password?
          </button>
        </div>
      </CardContent>
    </form>
  );
};

export default CustomerSignInForm;
