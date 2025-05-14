
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import ShopLogin from "@/pages/shop/Login";
import NotFound from "@/pages/NotFound";
import { AuthDebugger } from "@/components/debug/AuthDebugger";

const AuthRoutes = () => {
  return (
    <>
      {process.env.NODE_ENV === 'development' && <AuthDebugger componentName="AuthRoutes" />}
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/shop/login" element={<ShopLogin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AuthRoutes;
