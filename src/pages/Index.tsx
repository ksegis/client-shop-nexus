
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth"; 
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showDebug, setShowDebug] = useState(true); // Show debug immediately
  const [error, setError] = useState<string | null>(null);

  // Simplified direct navigation function that uses window.location for reliability
  const goToLogin = () => {
    console.log("Manual navigation to login triggered");
    // Use navigate instead of window.location for proper React Router navigation
    navigate("/shop/login");
  };
  
  const goToDashboard = () => {
    console.log("Manual navigation to dashboard triggered");
    navigate("/shop");
  };

  // For debugging purposes only
  useEffect(() => {
    console.log("Index: Debug information shown immediately");
    console.log("Index: Current auth state", { user: !!user, loading });
  }, [user, loading]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-6 max-w-md">
        <div className="mb-6">
          <ShoppingBag className="h-16 w-16 mx-auto text-shop-primary" />
          <h1 className="text-3xl font-bold mt-4 mb-2">Shop Management System</h1>
          <p className="text-gray-600">Access your shop dashboard or sign in</p>
        </div>
        
        {/* Always show primary button options regardless of auth state */}
        <div className="space-y-4 mb-6">
          <Button 
            onClick={goToLogin} 
            className="w-full py-6 text-lg"
            size="lg"
          >
            Go to Shop Login
          </Button>
          
          {user && (
            <Button 
              onClick={goToDashboard} 
              className="w-full" 
              variant="outline"
            >
              Access Dashboard
            </Button>
          )}
        </div>
        
        {loading && (
          <div className="flex flex-col items-center my-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading authentication state...</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Debug information */}
        {showDebug && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
            <p className="font-semibold text-amber-800 mb-2">Navigation Help</p>
            <p className="text-sm text-amber-700 mb-1">Auth state: {loading ? "Loading" : "Ready"}</p>
            <p className="text-sm text-amber-700 mb-1">User: {user ? "Logged in" : "Not logged in"}</p>
            <p className="text-sm text-amber-700">Current route: /</p>
            
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={goToLogin}
                className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
              >
                Use Direct Login Link
              </button>
              
              <button
                onClick={goToDashboard}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Use Direct Dashboard Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
