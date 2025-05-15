
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, CreditCard, Truck, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

export const QuickActions = () => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Access your most important information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            size={isMobile ? "lg" : "default"} 
            className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50"
            asChild
          >
            <Link to="/customer/estimates">
              <FileText className="h-6 w-6 text-blue-500" />
              <span>Estimates</span>
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size={isMobile ? "lg" : "default"} 
            className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50"
            asChild
          >
            <Link to="/customer/invoices">
              <CreditCard className="h-6 w-6 text-green-500" />
              <span>Invoices</span>
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size={isMobile ? "lg" : "default"} 
            className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50"
            asChild
          >
            <Link to="/customer/work-orders">
              <Wrench className="h-6 w-6 text-orange-500" />
              <span>Work Orders</span>
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size={isMobile ? "lg" : "default"} 
            className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50"
            asChild
          >
            <Link to="/customer/vehicles">
              <Truck className="h-6 w-6 text-purple-500" />
              <span>My Vehicles</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
