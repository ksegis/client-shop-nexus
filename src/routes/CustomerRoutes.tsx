
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLogin from "@/pages/customer/Login";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerEstimates from "@/pages/customer/Estimates";
import CustomerEstimateDetail from "@/pages/customer/EstimateDetail";
import CustomerInvoices from "@/pages/customer/Invoices";
import CustomerTransactions from "@/pages/customer/Transactions";
import CustomerSettings from "@/pages/customer/Settings";
import CustomerParts from "@/pages/customer/Parts";
import CustomerCheckout from "@/pages/customer/Checkout";
import CustomerServiceAppointments from "@/pages/customer/ServiceAppointments";
import NotFound from "@/pages/NotFound";
import { PartsCartProvider } from "@/contexts/parts/PartsCartContext";
import Layout from "@/components/layout/Layout";

const CustomerRoutes = () => {
  return (
    <PartsCartProvider>
      <Routes>
        <Route path="login" element={<CustomerLogin />} />
        
        <Route element={<Layout portalType="customer" />}>
          <Route index element={<CustomerProfile />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="estimates" element={<CustomerEstimates />} />
          <Route path="estimates/:estimateId" element={<CustomerEstimateDetail />} />
          <Route path="invoices" element={<CustomerInvoices />} />
          <Route path="transactions" element={<CustomerTransactions />} />
          <Route path="settings" element={<CustomerSettings />} />
          <Route path="parts" element={<CustomerParts />} />
          <Route path="checkout" element={<CustomerCheckout />} />
          <Route path="service-appointments" element={<CustomerServiceAppointments />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </PartsCartProvider>
  );
};

export default CustomerRoutes;
