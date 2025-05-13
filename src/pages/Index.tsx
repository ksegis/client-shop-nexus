
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth"; 
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, getRedirectPathByRole } = useAuth();

  // Automatically redirect based on role
  useEffect(() => {
    if (!loading && user) {
      const role = user.app_metadata?.role;
      const redirectPath = getRedirectPathByRole(role);
      navigate(redirectPath);
    }
  }, [user, loading, navigate, getRedirectPathByRole]);
  
  const goToCustomerLogin = () => {
    navigate("/customer/login");
  };
  
  const goToShopLogin = () => {
    navigate("/shop/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-6 max-w-md">
        <div className="mb-6">
          <ShoppingBag className="h-16 w-16 mx-auto text-shop-primary" />
          <h1 className="text-3xl font-bold mt-4 mb-2">Auto Repair Shop System</h1>
          <p className="text-gray-600">Please select your portal</p>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center my-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading authentication state...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={goToCustomerLogin} 
              className="w-full py-6 text-lg"
              size="lg"
            >
              Customer Portal
            </Button>
            
            <Button 
              onClick={goToShopLogin} 
              className="w-full py-6 text-lg"
              variant="outline"
              size="lg"
            >
              Shop Portal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
