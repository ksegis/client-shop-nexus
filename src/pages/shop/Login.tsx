
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuthHeader from '@/components/shop/auth/AuthHeader';
import SignInForm from '@/components/shop/auth/SignInForm';
import SignUpForm from '@/components/shop/auth/SignUpForm';
import { AuthorizationDebugger } from '@/components/debug/AuthorizationDebugger';
import { useEffect } from 'react';
import { useAuthFlowLogs } from '@/hooks/useAuthFlowLogs';

const ShopLogin = () => {
  const { logAuthFlowEvent } = useAuthFlowLogs();
  
  useEffect(() => {
    logAuthFlowEvent({
      event_type: 'shop_login_page_loaded',
      route_path: window.location.pathname,
      details: {
        context: 'Shop login page directly accessed'
      }
    });
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Add AuthorizationDebugger */}
      <AuthorizationDebugger />
      <Card className="w-full max-w-md">
        <AuthHeader />
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <SignInForm />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ShopLogin;
