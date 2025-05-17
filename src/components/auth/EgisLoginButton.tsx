
import React from "react";
import { Button } from "@/components/ui/button";
import { egisAuth } from "@/services/auth/egisAuth";
import { getEgisOAuthUrl } from "@/config";
import { LucideLogIn } from "lucide-react";

type EgisLoginButtonProps = {
  redirectPath?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "link" | "ghost";
  className?: string;
  children?: React.ReactNode;
};

/**
 * Button component for initiating EGIS Dynamics login flow
 */
const EgisLoginButton = ({ 
  redirectPath = '/shop',
  variant = "outline",
  className = "",
  children
}: EgisLoginButtonProps) => {
  // Handle EGIS login
  const handleEgisLogin = () => {
    // Generate state and store it for later verification
    const state = egisAuth.initiateAuth(redirectPath);
    
    // Redirect to EGIS auth URL
    const authUrl = getEgisOAuthUrl(state);
    window.location.href = authUrl;
  };

  return (
    <Button 
      onClick={handleEgisLogin}
      variant={variant} 
      className={className}
    >
      {children || (
        <>
          <LucideLogIn className="mr-2 h-4 w-4" />
          Login with EGIS Dynamics
        </>
      )}
    </Button>
  );
};

export default EgisLoginButton;
