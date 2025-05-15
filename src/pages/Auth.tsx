
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();
  
  const goToCustomerLogin = () => {
    navigate("/customer-login");
  };
  
  const goToShopLogin = () => {
    navigate("/shop-login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
