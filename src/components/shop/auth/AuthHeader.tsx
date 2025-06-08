
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const AuthHeader = () => {
  return (
    <CardHeader className="text-center">
      <div className="flex justify-center mb-4">
        <img 
          src="https://aw1.imgix.net/aw/_content/site/customtruckconnections/Logos/Logo-Primary.png?auto=format&dpr=2&fit=max&h=200&q=95&w=500"
          alt="Custom Truck Connections"
          className="h-12 w-auto max-w-full object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
      <CardDescription>Sign in to your shop account or create a new one</CardDescription>
    </CardHeader>
  );
};

export default AuthHeader;
