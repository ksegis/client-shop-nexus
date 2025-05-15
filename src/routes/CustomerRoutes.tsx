
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/customer/Dashboard";
import Profile from "@/pages/customer/Profile";
import Vehicles from "@/pages/customer/Vehicles";
import Parts from "@/pages/customer/Parts";
import WorkOrders from "@/pages/customer/WorkOrders";
import WorkOrderDetail from "@/pages/customer/WorkOrderDetail";
import Estimates from "@/pages/customer/Estimates";
import EstimateDetail from "@/pages/customer/EstimateDetail";
import Invoices from "@/pages/customer/Invoices";
import InvoiceDetail from "@/pages/customer/InvoiceDetail";
import Messages from "@/pages/customer/Messages";
import Transactions from "@/pages/customer/Transactions";
import NotFound from "@/pages/NotFound";

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout portalType="customer" />}>
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
        <Route 
          path="dashboard" 
          element={<Dashboard />} 
        />
        <Route 
          path="profile" 
          element={<Profile />} 
        />
        <Route 
          path="vehicles" 
          element={<Vehicles />} 
        />
        <Route 
          path="parts" 
          element={<Parts />} 
        />
        <Route 
          path="work-orders" 
          element={<WorkOrders />} 
        />
        <Route 
          path="work-orders/:id" 
          element={<WorkOrderDetail />} 
        />
        <Route 
          path="estimates" 
          element={<Estimates />} 
        />
        <Route 
          path="estimates/:id" 
          element={<EstimateDetail />} 
        />
        <Route 
          path="invoices" 
          element={<Invoices />} 
        />
        <Route 
          path="invoices/:id" 
          element={<InvoiceDetail />} 
        />
        <Route 
          path="messages" 
          element={<Messages />} 
        />
        <Route 
          path="transactions" 
          element={<Transactions />} 
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CustomerRoutes;
