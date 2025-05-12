
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth"; // Fixed import path
import AppRoutes from "./routes/AppRoutes";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// Wrap TooltipProvider in a functional component to fix the useState hook error
const TooltipProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return <TooltipProvider>{children}</TooltipProvider>;
};

// Debug component to display user role info
const UserRoleDebug = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("Current user:", user.email);
        console.log("User metadata:", user.app_metadata);
        
        // Also fetch profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserInfo({ user, profile });
        console.log("User profile:", profile);
      }
    };
    
    checkUserRole();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Hidden in production, only shown in development console
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProviderWrapper>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UserRoleDebug />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProviderWrapper>
  </QueryClientProvider>
);

export default App;
