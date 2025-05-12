
import { Routes, Route } from "react-router-dom";
import Auth from "@/pages/Auth";

const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
    </Routes>
  );
};

export default AuthRoutes;
