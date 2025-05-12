
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      // If user exists, redirect to the shop dashboard
      navigate("/shop");
    } else {
      // If no user, redirect to login
      navigate("/shop/login");
    }
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Loading Shop Management System...</h1>
      </div>
    </div>
  );
};

export default Index;
