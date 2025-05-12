
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth"; // Updated import
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // Toggle debug info after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDebug(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Force navigation after a timeout to prevent getting stuck
  useEffect(() => {
    const forcedNavigationTimer = setTimeout(() => {
      console.log("Index: Forcing navigation after timeout");
      setLocalLoading(false);
      
      if (user) {
        console.log("Index: Force navigating to shop dashboard");
        navigate("/shop", { replace: true });
      } else {
        console.log("Index: Force navigating to login");
        navigate("/shop/login", { replace: true });
      }
    }, 8000); // Force navigation after 8 seconds
    
    return () => clearTimeout(forcedNavigationTimer);
  }, [navigate, user]);

  useEffect(() => {
    // Only redirect after authentication state is confirmed
    if (loading) {
      console.log("Index: Auth state still loading");
      return;
    }
    
    setLocalLoading(false);
    console.log("Index: Auth state determined", { user: !!user, loading });
    
    try {
      if (user) {
        // If user exists, redirect to the shop dashboard
        console.log("Index: Redirecting to shop dashboard");
        navigate("/shop", { replace: true });
      } else {
        // If no user, redirect to login
        console.log("Index: Redirecting to shop/login");
        navigate("/shop/login", { replace: true });
      }
    } catch (error) {
      console.error("Index: Navigation error", error);
    }
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-6 max-w-md">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Loading Shop Management System...</h1>
        <p className="text-gray-500 mb-6">Please wait while we prepare your dashboard</p>
        
        {showDebug && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
            <p className="font-semibold text-amber-800 mb-2">Still loading?</p>
            <p className="text-sm text-amber-700 mb-1">Auth state: {loading ? "Loading" : "Ready"}</p>
            <p className="text-sm text-amber-700 mb-1">User: {user ? "Logged in" : "Not logged in"}</p>
            <p className="text-sm text-amber-700 mb-1">Local loading: {localLoading ? "Yes" : "No"}</p>
            <p className="text-sm text-amber-700">Current route: /</p>
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  console.log("Manual navigation triggered");
                  navigate("/shop/login", { replace: true });
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
