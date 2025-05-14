
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "@/pages/Auth";
import ShopLogin from "@/pages/shop/Login";
import NotFound from "@/pages/NotFound";

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/shop/login" element={<ShopLogin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AuthRoutes;
