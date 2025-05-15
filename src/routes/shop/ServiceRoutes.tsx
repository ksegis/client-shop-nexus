
import React from "react";
import { Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ServiceAppointments from "@/pages/shop/ServiceAppointments";
import ServiceDesk from "@/pages/shop/ServiceDesk";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

/**
 * Service desk and appointments routes
 */
const ServiceRoutes = () => {
  return (
    <>
      <Route 
        path="appointments" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <ServiceAppointments />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="service" 
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin', 'test_staff', 'test_admin']} requiredPortal="shop">
            <Layout portalType="shop">
              <ServiceDesk />
            </Layout>
          </ProtectedRoute>
        } 
      />
    </>
  );
};

export default ServiceRoutes;
