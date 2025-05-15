
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * This page now serves as a redirect handler since we've split the authentication
 * flows into separate shop and customer paths
 */
const Auth = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the main index page which now has the portal selection
    navigate("/", { replace: true });
  }, [navigate]);

  // Return a minimal loading state in case there's a delay in redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default Auth;
