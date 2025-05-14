
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, User, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <header className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-shop-primary" />
            <span className="font-bold text-xl text-shop-primary">Custom Truck Connections</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Your Truck Service Management Portal</h1>
          <p className="text-xl text-gray-600 mb-8">Complete maintenance solutions for your commercial truck fleet</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Customer Portal</h2>
                <p className="text-gray-600 mb-6">Track your service history, approve estimates, and manage your vehicles</p>
                <Button asChild className="w-full">
                  <Link to="/customer">
                    Access Customer Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-shop-light flex items-center justify-center mb-4">
                  <Wrench className="h-6 w-6 text-shop-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Shop Portal</h2>
                <p className="text-gray-600 mb-6">For shop staff only. Manage operations, inventory, and customer services</p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/shop">
                    Access Shop Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t bg-gray-50">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Custom Truck Connections. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
