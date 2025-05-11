
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Auth Page
import Auth from "./pages/Auth";

// Customer Portal Pages
import CustomerLogin from "./pages/customer/Login";
import CustomerProfile from "./pages/customer/Profile";
import CustomerEstimates from "./pages/customer/Estimates";
import CustomerEstimateDetail from "./pages/customer/EstimateDetail";

// Shop Portal Pages
import ShopDashboard from "./pages/shop/Dashboard";
import ShopReports from "./pages/shop/Reports";
import ShopEmployees from "./pages/shop/Employees";
import ShopInventory from "./pages/shop/Inventory";

// Not Found Page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Redirect root to shop dashboard */}
            <Route path="/" element={<Navigate to="/shop" replace />} />

            {/* Auth Route */}
            <Route path="/auth" element={<Auth />} />

            {/* Customer Portal Routes */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route 
              path="/customer/profile" 
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/estimates" 
              element={
                <ProtectedRoute>
                  <CustomerEstimates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer/estimates/:id" 
              element={
                <ProtectedRoute>
                  <CustomerEstimateDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Shop Portal Routes */}
            <Route 
              path="/shop" 
              element={
                <ProtectedRoute>
                  <ShopDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Reports Route */}
            <Route 
              path="/shop/reports" 
              element={
                <ProtectedRoute>
                  <ShopReports />
                </ProtectedRoute>
              } 
            />
            
            {/* Employees Route */}
            <Route 
              path="/shop/employees" 
              element={
                <ProtectedRoute>
                  <ShopEmployees />
                </ProtectedRoute>
              } 
            />

            {/* Inventory Route */}
            <Route 
              path="/shop/inventory" 
              element={
                <ProtectedRoute>
                  <ShopInventory />
                </ProtectedRoute>
              } 
            />
            
            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
