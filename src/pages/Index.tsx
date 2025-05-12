
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect after authentication state is confirmed
    if (loading) return;
    
    console.log("Index: Auth state determined", { user: !!user, loading });
    
    if (user) {
      // If user exists, redirect to the shop dashboard
      console.log("Index: Redirecting to shop dashboard");
      navigate("/shop", { replace: true });
    } else {
      // If no user, redirect to login
      console.log("Index: Redirecting to login");
      navigate("/shop/login", { replace: true });
    }
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Loading Shop Management System...</h1>
        <p className="text-gray-500">Please wait while we prepare your dashboard</p>
      </div>
    </div>
  );
};

export default Index;
