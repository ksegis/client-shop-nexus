
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <img 
                  src="https://aw1.imgix.net/aw/_content/site/customtruckconnections/Logos/Logo-Primary.png?auto=format&dpr=2&fit=max&h=200&q=95&w=500"
                  alt="Custom Truck Connections"
                  className="h-16 w-auto max-w-full object-contain"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>
              <CardDescription className="text-gray-600 mb-8">Choose your portal</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/shop-login')} 
                className="w-full py-6 text-lg"
                size="lg"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Portal
              </Button>
              
              <Button 
                onClick={() => navigate('/customer-login')} 
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

export default Index;
