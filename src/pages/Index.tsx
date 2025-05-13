
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth"; 
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show debug info immediately to help with navigation issues
  useEffect(() => {
    setShowDebug(true);
    console.log("Index: Debug information shown immediately");
  }, []);

  // Simplified navigation logic - redirect immediately when auth state is determined
  useEffect(() => {
    if (loading) {
      console.log("Index: Auth state still loading");
      return;
    }
    
    console.log("Index: Auth state determined", { user: !!user, loading });
    
    try {
      if (user) {
        console.log("Index: User is authenticated, redirecting to shop dashboard");
        navigate("/shop", { replace: true });
      } else {
        console.log("Index: No authenticated user, redirecting to login");
        navigate("/shop/login", { replace: true });
      }
    } catch (navigationError) {
      console.error("Index: Navigation error", navigationError);
      setError("Navigation error: Could not redirect automatically. Please use the buttons below.");
    }
  }, [navigate, user, loading]);

  // Handle manual navigation
  const goToLogin = () => {
    console.log("Manual navigation to login triggered");
    window.location.href = "/shop/login";
  };

  const goToDashboard = () => {
    console.log("Manual navigation to dashboard triggered");
    window.location.href = "/shop";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-6 max-w-md">
        <div className="mb-6">
          <ShoppingBag className="h-16 w-16 mx-auto text-shop-primary" />
          <h1 className="text-3xl font-bold mt-4 mb-2">Shop Management System</h1>
          <p className="text-gray-600">Access your shop dashboard or sign in</p>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading authentication state...</p>
          </div>
        ) : (
          <div className="space-y-4">
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
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
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
