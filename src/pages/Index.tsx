
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    if (user) {
      navigate("/shop");
    } else {
      navigate("/auth");
    }
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading Shop Management System...</h1>
      </div>
    </div>
  );
};

export default Index;
