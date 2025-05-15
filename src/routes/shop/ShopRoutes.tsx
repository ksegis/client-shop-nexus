
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/shop/Dashboard";
import Profile from "@/pages/shop/Profile";
import Customers from "@/pages/shop/Customers";
import Estimates from "@/pages/shop/Estimates";
import Inventory from "@/pages/shop/Inventory";
import Parts from "@/pages/shop/Parts";
import ServiceDesk from "@/pages/shop/ServiceDesk";
import ServiceAppointments from "@/pages/shop/ServiceAppointments";
import SimpleInventory from "@/pages/shop/SimpleInventory";
import Employees from "@/pages/shop/Employees";
import WorkOrders from "@/pages/shop/WorkOrders";
import TestUsers from "@/pages/shop/admin/TestUsers";
import AdminPage from "@/pages/shop/admin/AdminPage";
import WorkOrderDetailPage from "@/pages/shop/work-orders/WorkOrderDetailPage";
import AuthLogs from "@/pages/shop/admin/AuthLogs";
import { useAuth } from "@/contexts/auth";
import NotFound from "@/pages/NotFound";
import { useAuthFlowLogs } from "@/hooks/useAuthFlowLogs";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ShopRoutes = () => {
  const { profile, user } = useAuth();
  const location = useLocation();
  const { logAuthFlowEvent } = useAuthFlowLogs();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'test_admin';
  
  // Log when shop routes are loaded
  useEffect(() => {
    logAuthFlowEvent({
      event_type: 'shop_routes_loaded',
      user_id: user?.id,
      email: user?.email,
      user_role: profile?.role,
      route_path: location.pathname,
      details: {
        isAdmin
      }
    });
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/estimates" element={<Estimates />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
        <Route path="/invoices" element={<Navigate to="/shop" replace />} />
        <Route path="/reports" element={<Navigate to="/shop" replace />} />
        <Route path="/parts" element={<Parts />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/simple" element={<SimpleInventory />} />
        <Route path="/service-desk" element={<ServiceDesk />} />
        <Route path="/service-appointments" element={<ServiceAppointments />} />
        <Route path="/employees" element={isAdmin ? <Employees /> : <Navigate to="/shop" replace />} />
        
        {/* Admin routes */}
        {isAdmin && (
          <>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/test-users" element={<TestUsers />} />
            <Route path="/admin/auth-logs" element={<AuthLogs />} />
          </>
        )}
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

export default ShopRoutes;
