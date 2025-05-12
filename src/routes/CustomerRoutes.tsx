
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CustomerLogin from "@/pages/customer/Login";
import CustomerProfile from "@/pages/customer/Profile";
import CustomerEstimates from "@/pages/customer/Estimates";
import CustomerEstimateDetail from "@/pages/customer/EstimateDetail";
import CustomerInvoices from "@/pages/customer/Invoices";
import CustomerTransactions from "@/pages/customer/Transactions";

const CustomerRoutes = () => {
  return (
    <>
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
      <Route 
        path="/customer/invoices" 
        element={
          <ProtectedRoute>
            <CustomerInvoices />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/transactions" 
        element={
          <ProtectedRoute>
            <CustomerTransactions />
          </ProtectedRoute>
        } 
      />
    </>
  );
};

export default CustomerRoutes;
