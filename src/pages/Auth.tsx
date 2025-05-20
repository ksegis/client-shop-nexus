import React, { useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import EgisLoginButton from "@/components/auth/EgisLoginButton";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/contexts/auth";

/**
 * This page serves as a redirect handler for authentication flows
 */
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const error = searchParams.get("error");
  const type = searchParams.get("type");
  
  useEffect(() => {
    // First check if user is already authenticated
    if (isAuthenticated) {
      console.log("User is already authenticated, redirecting to dashboard");
      navigate("/", { replace: true });
      return;
    }
    
    // Check for password reset flow
    if (type === "recovery") {
      console.log("Password recovery flow detected, redirecting to change password page");
      // If it's a password reset, direct to the change password page
      navigate("/auth/change-password", { replace: true });
      return;
    }
    
    // If there's an error, we'll stay on this page to display it
    if (error) {
      console.log(`Authentication error detected: ${error}`);
      return;
    }
    
    // Otherwise just show the portal selection
    console.log("Showing portal selection");
  }, [error, type, navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Shop Management System</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
            <p className="font-semibold">Authentication Error</p>
            <p className="text-sm">{error === 'auth_failed' 
              ? 'Failed to authenticate. Please try again.'
              : error === 'invalid_callback' 
              ? 'Invalid authentication callback. Please try again.'
              : error}
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Select your login method:</p>
            
            <div className="grid gap-2">
              <Link to="/shop-login" className="w-full">
                <Button className="w-full">
                  Login with Email & Password
                </Button>
              </Link>
              
              <EgisLoginButton 
                redirectPath="/shop"
                className="w-full"
              />
              
              <div className="mt-4 text-center">
                <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
