
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  // Toggle debug info after 5 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDebug(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only redirect after authentication state is confirmed
    if (loading) {
      console.log("Index: Auth state still loading");
      return;
    }
    
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
            <p className="text-sm text-amber-700">Current route: /</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
