
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const CustomerAuthHeader = () => {
  return (
    <CardHeader className="text-center space-y-1">
      <div className="flex justify-center mb-4">
        <img 
          src="https://aw1.imgix.net/aw/_content/site/customtruckconnections/Logos/Logo-Primary.png?auto=format&dpr=1&fit=max&h=95&q=75&w=237"
          alt="Custom Truck Connections"
          className="h-12 w-auto max-w-full object-contain"
        />
      </div>
      <CardDescription>
        Sign in to access your customer account
      </CardDescription>
    </CardHeader>
  );
};

export default CustomerAuthHeader;
