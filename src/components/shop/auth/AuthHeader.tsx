
import { ShieldCheck } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const AuthHeader = () => {
  return (
    <CardHeader className="text-center">
      <div className="flex justify-center mb-2">
        <ShieldCheck className="h-12 w-12 text-primary" />
      </div>
      <CardTitle className="text-2xl">Custom Truck Connections</CardTitle>
      <CardDescription>Sign in to your shop account or create a new one</CardDescription>
    </CardHeader>
  );
};

export default AuthHeader;
