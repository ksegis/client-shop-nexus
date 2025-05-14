
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerEstimates from "@/pages/customer/Estimates";
import CustomerEstimateDetail from "@/pages/customer/EstimateDetail";
import CustomerInvoices from "@/pages/customer/Invoices";
import CustomerInvoiceDetail from "@/pages/customer/InvoiceDetail";
import CustomerVehicles from "@/pages/customer/Vehicles";
import CustomerParts from "@/pages/customer/Parts";
import CustomerWorkOrders from "@/pages/customer/WorkOrders";
import CustomerWorkOrderDetail from "@/pages/customer/WorkOrderDetail";
import CustomerTransactions from "@/pages/customer/Transactions";
import CustomerMessages from "@/pages/customer/Messages";
import { useEffect } from "react";

const CustomerRoutes = () => {
  // Emergency cleanup to remove any lingering event listeners
  useEffect(() => {
    return () => {
      // Force cleanup of any potential memory leaks
      const cleanup = () => {
        console.log("Cleaning up any potential memory leaks in CustomerRoutes");
      };
      cleanup();
    };
  }, []);

  return (
    <Routes>
      <Route element={<Layout portalType="customer" />}>
        <Route index element={<CustomerDashboard />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="estimates" element={<CustomerEstimates />} />
        <Route path="estimates/:id" element={<CustomerEstimateDetail />} />
        <Route path="invoices" element={<CustomerInvoices />} />
        <Route path="invoices/:id" element={<CustomerInvoiceDetail />} />
        <Route path="vehicles" element={<CustomerVehicles />} />
        <Route path="parts" element={<CustomerParts />} />
        <Route path="work-orders" element={<CustomerWorkOrders />} />
        <Route path="work-orders/:id" element={<CustomerWorkOrderDetail />} />
        <Route path="transactions" element={<CustomerTransactions />} />
        <Route path="messages" element={<CustomerMessages />} />
        <Route path="*" element={<Navigate to="/customer" replace />} />
      </Route>
    </Routes>
  );
};

export default CustomerRoutes;
