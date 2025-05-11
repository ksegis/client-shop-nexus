
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Customer Portal Pages
import CustomerLogin from "./pages/customer/Login";
import CustomerProfile from "./pages/customer/Profile";
import CustomerEstimates from "./pages/customer/Estimates";
import CustomerEstimateDetail from "./pages/customer/EstimateDetail";

// Shop Portal Pages
import ShopDashboard from "./pages/shop/Dashboard";

// Not Found Page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to shop dashboard */}
          <Route path="/" element={<Navigate to="/shop" replace />} />

          {/* Customer Portal Routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/estimates" element={<CustomerEstimates />} />
          <Route path="/customer/estimates/:id" element={<CustomerEstimateDetail />} />
          
          {/* Shop Portal Routes */}
          <Route path="/shop" element={<ShopDashboard />} />
          
          {/* Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
