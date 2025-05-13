
import { useEffect } from "react";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const navigate = useNavigate();
  
  // Handle hash fragment if it exists
  useEffect(() => {
    if (window.location.hash === '#') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  
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
