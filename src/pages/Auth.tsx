
import { useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Handle hash fragment if it exists and clean up URL
  useEffect(() => {
    // Remove any hash fragments from the URL
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // If user is already authenticated, redirect to appropriate portal
    if (!loading && user) {
      const role = user.app_metadata?.role;
      if (role === 'admin' || role === 'staff') {
        navigate("/shop", { replace: true });
      } else if (role === 'customer') {
        navigate("/customer/profile", { replace: true });
      }
    }
  }, [loading, user, navigate]);
  
  const goToCustomerLogin = () => {
    navigate("/customer/login");
  };
  
  const goToShopLogin = () => {
    // Log for debugging
    console.log("Shop login clicked, current user:", user?.email);
    console.log("User metadata:", user?.app_metadata);
    
    if (user?.app_metadata?.role === 'customer') {
      toast({
        title: "Access Restricted",
        description: "Customers can only access the Customer Portal",
        variant: "destructive",
      });
      navigate("/customer/profile");
    } else {
      navigate("/shop/login");
    }
  };

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
