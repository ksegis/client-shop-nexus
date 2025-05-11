
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate login process
    setTimeout(() => {
      setLoading(false);
      console.log('Login attempt with:', { email, password });
      toast({
        title: "Login Placeholder",
        description: "This would trigger the GHL login webhook in production.",
      });
      
      // For demo purposes only - would be removed in production
      if (email && password) {
        window.location.href = '/customer/profile';
      }
    }, 1000);

    // TODO: trigger GHL login webhook
    console.log('<!-- TODO: trigger GHL login webhook -->');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)]">
      <Card className="w-full max-w-md p-6 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-shop-dark">Customer Portal Login</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your vehicles and service records</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email" 
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div>
            <Button 
              type="submit"
              className="w-full bg-shop-primary hover:bg-shop-primary/90"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <Button 
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              console.log('Google login clicked');
              toast({
                title: "Google Login",
                description: "This would trigger the Google OAuth flow in production.",
              });
              // TODO: trigger Google OAuth flow
            }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Login with Google
          </Button>

          <div className="text-center text-sm text-gray-500 mt-4">
            <a href="#" className="text-shop-primary hover:underline">Forgot password?</a>
            <div className="mt-2">
              New customer? <a href="#" className="text-shop-primary hover:underline">Create an account</a>
            </div>
          </div>
        </form>

        {/* Integration placeholder comment */}
        {/* <!-- TODO: trigger GHL login webhook --> */}
        {/* <!-- TODO: store login state via GHL webhook → Zapier → Supabase --> */}
      </Card>
    </div>
  );
};

export default CustomerLogin;
