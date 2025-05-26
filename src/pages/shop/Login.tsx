
import { Card } from '@/components/ui/card';
import AuthHeader from '@/components/shop/auth/AuthHeader';
import SignInForm from '@/components/shop/auth/SignInForm';

const ShopLogin = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <AuthHeader />
        <SignInForm />
      </Card>
    </div>
  );
};

export default ShopLogin;
