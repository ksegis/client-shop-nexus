
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerSignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate brief loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Access granted",
        description: "No authentication required"
      });
      navigate('/customer/dashboard');
    }, 500);
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
          <Input 
            id="customer-signin-password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
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
            onClick={() => navigate('/customer/dashboard')}
          >
            Skip sign in & go to dashboard
          </button>
        </div>
      </CardContent>
    </form>
  );
};

export default CustomerSignInForm;
