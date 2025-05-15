
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User } from "lucide-react";

const CustomerAuthHeader = () => {
  return (
    <CardHeader className="text-center space-y-1">
      <div className="flex justify-center mb-2">
        <div className="p-2 bg-primary/10 rounded-full">
          <User className="h-6 w-6 text-primary" />
        </div>
      </div>
      <CardTitle className="text-2xl">Custom Trick Connections</CardTitle>
      <CardDescription>
        Sign in to access your customer account
      </CardDescription>
    </CardHeader>
  );
};

export default CustomerAuthHeader;
