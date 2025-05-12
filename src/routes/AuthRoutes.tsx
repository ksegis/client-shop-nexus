
import { Routes, Route } from "react-router-dom";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AuthRoutes;
