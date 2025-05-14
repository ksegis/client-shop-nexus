
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, User, Users, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Auth = () => {
  const navigate = useNavigate();
  const { impersonateTestUser, isAuthenticated, profile } = useAuth();
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  
  // If already authenticated, redirect to the appropriate portal
  useEffect(() => {
    if (isAuthenticated && profile?.role) {
      const path = profile.role.includes('customer') ? 
        '/customer/profile' : 
        '/shop';
      navigate(path, { replace: true });
    }
  }, [isAuthenticated, profile, navigate]);
  
  const goToCustomerLogin = () => {
    navigate("/customer/profile");
  };
  
  const goToShopLogin = () => {
    navigate("/shop");
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
      <div className="w-full max-w-md p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-6">
              <ShoppingBag className="h-16 w-16 mx-auto text-shop-primary" />
              <CardTitle className="text-3xl font-bold mt-4 mb-2">Custom Truck Connection</CardTitle>
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
