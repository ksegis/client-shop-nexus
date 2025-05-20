
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const CustomerSignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Attempt to sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // Check if the user has MFA enabled
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mfa_enabled')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (profile?.mfa_enabled) {
          // Store minimal session info for MFA verification
          sessionStorage.setItem('mfaSession', JSON.stringify({
            userId: data.user.id,
            email: data.user.email
          }));
          
          // Redirect to MFA verification page with state
          navigate('/verify-mfa', { 
            state: { 
              userId: data.user.id,
              email: data.user.email 
            }
          });
          return;
        }
      }
      
      // If no MFA required, proceed with normal login flow
      toast({
        title: "Login successful",
        description: "Welcome to your customer portal!"
      });
      
      navigate('/customer');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2"
              onClick={togglePasswordVisibility}
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
            onClick={() => navigate('/customer/reset-password')}
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
