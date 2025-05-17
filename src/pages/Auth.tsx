
import React, { useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { egisAuth } from "@/services/auth/egisAuth";
import { getEgisOAuthUrl } from "@/config";

/**
 * This page now serves as a redirect handler for authentication flows
 */
const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  
  // Handle EGIS login
  const handleEgisLogin = () => {
    // Generate state and store it for later verification
    const state = egisAuth.initiateAuth('/shop');
    
    // Redirect to EGIS auth URL
    const authUrl = getEgisOAuthUrl(state);
    window.location.href = authUrl;
  };
  
  useEffect(() => {
    // Check if we need to show this page or redirect to homepage
    if (!error) {
      console.log("No error parameter, showing portal selection");
    }
  }, [error, navigate]);

  // Return a minimal auth page with EGIS login option
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
              
              <Button 
                onClick={handleEgisLogin}
                variant="outline" 
                className="w-full"
              >
                Login with EGIS
              </Button>
              
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
