
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerAuthHeader from '@/components/customer/auth/CustomerAuthHeader';
import CustomerSignInForm from '@/components/customer/auth/CustomerSignInForm';
import CustomerSignUpForm from '@/components/customer/auth/CustomerSignUpForm';
import { AuthorizationDebugger } from '@/components/debug/AuthorizationDebugger';

const CustomerLogin = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Add AuthorizationDebugger */}
      <AuthorizationDebugger />
      <Card className="w-full max-w-md">
        <CustomerAuthHeader />
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <CustomerSignInForm />
          </TabsContent>
          
          <TabsContent value="signup">
            <CustomerSignUpForm />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default CustomerLogin;
