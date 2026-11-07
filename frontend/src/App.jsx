import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { CallProvider } from "../contexts/CallContext";
import CallOverlay from "../components/Call/IncomingCallOverlay";

import PrivateRoute from "../services/PrivateRoute";
import PublicRoute from "../services/PublicRoute";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import VerifyEmail from "../pages/VerifyEmail";
import ResendEmail from "../pages/ResendEmail";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Friends from "../pages/Friends";
import Message from "../pages/Message";
import Profile from "../pages/Profile";
import SinglePost from "../pages/SinglePost";
import ProfilePosts from "../components/Profile/ProfilePosts";
import ProfileAbout from "../components/Profile/ProfileAbout";
import ProfileShares from "../components/Profile/ProfileShares";
import CallPage from "../pages/CallPage";
import IncomingCallOverlay from "../components/Call/IncomingCallOverlay";

const ProtectedLayout = () => {
  return (
    <PrivateRoute>
      <CallProvider>
        <NotificationProvider>
          <Outlet />
        </NotificationProvider>
        <IncomingCallOverlay />
      </CallProvider>
    </PrivateRoute>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            <Route
              path="/verify-email/:uidb64/:token"
              element={
                <PublicRoute>
                  <VerifyEmail />
                </PublicRoute>
              }
            />

            <Route
              path="/resend-email"
              element={
                <PublicRoute>
                  <ResendEmail />
                </PublicRoute>
              }
            />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/reset-password/:uidb64/:token"
              element={<ResetPassword />}
            />

            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/message" element={<Message />} />
              <Route path="/profile/:username" element={<Profile />}>
                <Route index element={<ProfilePosts />} />
                <Route path="about" element={<ProfileAbout />} />
                <Route path="shares" element={<ProfileShares />} />
              </Route>
              <Route path="/post/:postId" element={<SinglePost />} />
            </Route>
            <Route path="/call" element={<PrivateRoute><CallPage /></PrivateRoute>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;