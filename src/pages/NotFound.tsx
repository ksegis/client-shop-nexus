
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-6">Page Not Found</p>
        <p className="text-gray-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col space-y-3">
          <Button asChild className="w-full">
            <Link to="/shop">
              <HomeIcon className="mr-2 h-4 w-4" />
              Go to Shop Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/customer">Go to Customer Portal</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
