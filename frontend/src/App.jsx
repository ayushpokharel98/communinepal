import { AuthProvider } from "../contexts/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "../services/PrivateRoute"
import PublicRoute from "../services/PublicRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup"
import VerifyEmail from "../pages/VerifyEmail";
import ResendEmail from "../pages/ResendEmail";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />
          <Route path="/verify-email/:uidb64/:token" element={
            <PublicRoute>
              <VerifyEmail />
            </PublicRoute>
          } />
          <Route path="/resend-email" element={
            <PublicRoute>
              <ResendEmail />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <ForgotPassword />
          } />
          <Route path="/reset-password/:uidb64/:token" element={
            <ResetPassword />
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App