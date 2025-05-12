
import { Route } from "react-router-dom";
import Auth from "@/pages/Auth";

const AuthRoutes = () => {
  return (
    <>
      {/* Auth Routes */}
      <Route path="/auth" element={<Auth />} />
    </>
  );
};

export default AuthRoutes;
