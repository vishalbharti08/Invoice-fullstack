import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Navigate } from "react-router-dom";

import "react-toastify/dist/ReactToastify.css";
import VendorPage from "./components/VendorPage";
import LoginPage from "./components/LoginPage";
import FinancePage from "./components/FinancePage";
import SignUP from "./components/SignUP";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./components/VendorManagement/AdminPage";
// import ProfilePage from "./components/ProfilePage";

const App = () => {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={2000} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUP />} />

        <Route
          path="/finance-dashboard"
          element={
            <ProtectedRoute allowedRoles={["finance"]}>
              <FinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor-dashboard"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* <Route
          path="/vendor-profile"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        /> */}

        <Route path="/unauthorized" element={<h2>Unauthorized Access</h2>} />

        <Route path="/dashboard" element={<h2>Please Back to Login Page</h2>} />
      </Routes>
    </Router>
  );
};

export default App;
