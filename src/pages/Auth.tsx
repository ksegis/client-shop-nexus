
import { useEffect, useState } from "react";
import { ShoppingBag, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { toast } from "@/components/ui/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [loadingState, setLoadingState] = useState<'idle' | 'redirecting'>('idle');
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  
  // Handle hash fragment if it exists and clean up URL
  useEffect(() => {
    // Remove any hash fragments from the URL
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // Only redirect if we have both user and role information and we're not loading
    if (!loading && user && user.app_metadata?.role) {
      const role = user.app_metadata.role;
      console.log("Auth page: redirecting based on role:", role);
      setLoadingState('redirecting');
      
      // Add a small delay to prevent redirect loops
      const timer = setTimeout(() => {
        if (role === 'admin' || role === 'staff') {
          navigate("/shop", { replace: true });
        } else if (role === 'customer') {
          navigate("/customer/profile", { replace: true });
        } else {
          // If we have an unrecognized role, show an error
          setLoadingState('idle');
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Unknown user role. Please contact support.",
          });
        }
      }, 400);
      
      return () => clearTimeout(timer);
    }
    
    // If we're not loading but have a user without a role, we need to wait or retry
    if (!loading && user && !user.app_metadata?.role && redirectAttempts < 5) {
      // Show a timeout message after a few seconds
      const timeoutMessage = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 5000);
      
      // Try again after a delay
      const timer = setTimeout(() => {
        setRedirectAttempts(prev => prev + 1);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(timeoutMessage);
      };
    }
  }, [loading, user, navigate, redirectAttempts]);
  
  const goToCustomerLogin = () => {
    navigate("/customer/login");
  };
  
  const goToShopLogin = () => {
    navigate("/shop/login");
  };

  // Show a loading state when redirecting or just after authentication
  if (loadingState === 'redirecting' || loading || (user && !user.app_metadata?.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-center p-6 max-w-md">
          <Loader2 className="h-16 w-16 mx-auto text-shop-primary animate-spin" />
          <h1 className="text-2xl font-bold mt-6 mb-2">Loading Authentication...</h1>
          <p className="text-gray-600 mb-2">Please wait while we verify your credentials</p>
          
          {showTimeoutMessage && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-800">
                Taking a bit longer than usual... We're still working on it.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-3"
              >
                Refresh Page
              </Button>
            </div>
          )}
          
          {redirectAttempts > 2 && (
            <p className="text-sm text-gray-500 mt-6">
              Experiencing issues? Try signing out and signing back in.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-6 max-w-md">
        <div className="mb-6">
          <ShoppingBag className="h-16 w-16 mx-auto text-shop-primary" />
          <h1 className="text-3xl font-bold mt-4 mb-2">Custom Truck Connection</h1>
          <p className="text-gray-600 mb-8">Access your portal or sign in</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={goToShopLogin} 
            className="w-full py-6 text-lg"
            size="lg"
          >
            Shop Portal
          </Button>
          
          <Button 
            onClick={goToCustomerLogin} 
            className="w-full py-6 text-lg"
            variant="outline"
            size="lg"
          >
            Customer Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
