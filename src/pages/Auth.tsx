import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, User, Users, FlaskConical } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthDebugger } from "@/components/debug/AuthDebugger";
import { AuthorizationDebugger } from "@/components/debug/AuthorizationDebugger";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { impersonateTestUser, isAuthenticated, profile, portalType } = useAuth();
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  
  // Get the "from" redirect parameter if it exists
  const searchParams = new URLSearchParams(location.search);
  const fromPath = searchParams.get('from');
  
  // Log initial authentication state
  useEffect(() => {
    console.log('Auth Page - Initial State:', { 
      isAuthenticated, 
      profileRole: profile?.role,
      pathname: window.location.pathname,
      fromPath
    });
  }, [isAuthenticated, profile, fromPath]);
  
  // If already authenticated, redirect to the appropriate portal or the original "from" path
  useEffect(() => {
    if (isAuthenticated && portalType) {
      // If we have a "from" path, redirect there if it's in the correct portal
      let redirectPath = portalType === 'customer' ? '/customer' : '/shop';
      
      if (fromPath) {
        const isFromPathForCorrectPortal = 
          (portalType === 'customer' && fromPath.startsWith('/customer')) ||
          (portalType === 'shop' && fromPath.startsWith('/shop'));
          
        if (isFromPathForCorrectPortal) {
          redirectPath = fromPath;
        }
      }
      
      console.log(`Auth Page - Redirecting to ${redirectPath} (already authenticated)`);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, portalType, navigate, fromPath]);
  
  // Updated to navigate to auth login instead of direct customer page
  const goToCustomerLogin = () => {
    // Instead of directly navigating to the customer page, switch to customer login
    // This will now go through the authentication flow first
    navigate("/auth/customer-login");
  };
  
  const goToShopLogin = () => {
    navigate("/shop/login");
  };

  const switchToTestAccount = (role: 'test_customer' | 'test_staff' | 'test_admin') => {
    setIsLoadingTest(true);
    setTimeout(() => {
      impersonateTestUser(role);
      setIsLoadingTest(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {process.env.NODE_ENV === 'development' && <AuthDebugger componentName="AuthPage" />}
      {/* Add the AuthorizationDebugger */}
      <AuthorizationDebugger />
      <div className="w-full max-w-md p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-6">
              <ShoppingBag className="h-16 w-16 mx-auto text-shop-primary" />
              <CardTitle className="text-3xl font-bold mt-4 mb-2">Custom Trick Connections</CardTitle>
              <CardDescription className="text-gray-600 mb-8">Access your portal</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Tabs defaultValue="portals">
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="portals">Portals</TabsTrigger>
                <TabsTrigger value="test-accounts">Test Accounts</TabsTrigger>
              </TabsList>
            
              <TabsContent value="portals">
                <div className="space-y-4">
                  <Button 
                    onClick={goToShopLogin} 
                    className="w-full py-6 text-lg"
                    size="lg"
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Shop Portal
                  </Button>
                  
                  <Button 
                    onClick={goToCustomerLogin} 
                    className="w-full py-6 text-lg"
                    variant="outline"
                    size="lg"
                  >
                    <User className="mr-2 h-5 w-5" />
                    Customer Portal
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="test-accounts">
                <div className="space-y-4">
                  <div className="bg-muted rounded-md p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">Test Mode</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      These test accounts allow you to explore different user experiences
                      without affecting production data.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => switchToTestAccount('test_customer')} 
                    className="w-full"
                    variant="secondary"
                    disabled={isLoadingTest}
                  >
                    {isLoadingTest ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    Test Customer Account
                  </Button>
                  
                  <Button 
                    onClick={() => switchToTestAccount('test_staff')} 
                    className="w-full"
                    variant="secondary"
                    disabled={isLoadingTest}
                  >
                    {isLoadingTest ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    Test Staff Account
                  </Button>
                  
                  <Button 
                    onClick={() => switchToTestAccount('test_admin')} 
                    className="w-full"
                    variant="secondary"
                    disabled={isLoadingTest}
                  >
                    {isLoadingTest ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <ShoppingBag className="mr-2 h-4 w-4" />
                    )}
                    Test Admin Account
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
