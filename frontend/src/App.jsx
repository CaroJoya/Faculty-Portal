import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Faculty
import FacultyDashboard from "./pages/Dashboard";
import FacultyRequestLeave from "./pages/RequestLeave";
import FacultyStatus from "./pages/Status";
import FacultyProfile from "./pages/Profile";
import FacultyVacation from "./pages/Vacation";
import History from "./pages/History";
import Stats from "./pages/Stats";

// Role-specific dashboards
import HODDashboard from "./pages/HODDashboard";
import RegistryDashboard from "./pages/RegistryDashboard";
import OfficeStaffDashboard from "./pages/OfficeStaffDashboard";
import HeadClerkDashboard from "./pages/HeadClerkDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";

// Role-specific pages
import HODRequestLeave from "./pages/HODRequestLeave";
import OfficeStaffRequestLeave from "./pages/OfficeStaffRequestLeave";
import OfficeStaffHistory from "./pages/OfficeStaffHistory";
import OfficeStaffStats from "./pages/OfficeStaffStats";
import RegistryRequestLeave from "./pages/RegistryRequestLeave";

// Role vacation (all use same Vacation component)
import OfficeStaffVacation from "./pages/Vacation";
import RegistryVacation from "./pages/Vacation";
import HODVacation from "./pages/Vacation";

// ---- helpers ----
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const user = getUser();
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

// ---- app ----
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Auth Routes - No protection needed */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Shared Routes - All roles */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <FacultyDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/request-leave"
          element={
            <RequireAuth>
              <FacultyRequestLeave />
            </RequireAuth>
          }
        />
        <Route
          path="/status"
          element={
            <RequireAuth>
              <FacultyStatus />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <FacultyProfile />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <History />
            </RequireAuth>
          }
        />
        <Route
          path="/stats"
          element={
            <RequireAuth>
              <Stats />
            </RequireAuth>
          }
        />
        <Route
          path="/vacation"
          element={
            <RequireAuth>
              <FacultyVacation />
            </RequireAuth>
          }
        />

        {/* HOD Routes */}
        <Route
          path="/hod-dashboard"
          element={
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/hod/request-leave"
          element={
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODRequestLeave />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/hod/status"
          element={
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <FacultyStatus />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/hod/history"
          element={
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <History />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/hod/stats"
          element={
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <Stats />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/hod/vacation"
          element={
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODVacation />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/hod/profile"
          element={
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <FacultyProfile />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Registry Routes */}
        <Route
          path="/registry-dashboard"
          element={
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/registry/request-leave"
          element={
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryRequestLeave />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/registry/status"
          element={
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <FacultyStatus />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/registry/history"
          element={
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <History />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/registry/stats"
          element={
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <Stats />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/registry/vacation"
          element={
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryVacation />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/registry/profile"
          element={
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <FacultyProfile />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Office Staff Routes */}
        <Route
          path="/officestaff-dashboard"
          element={
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/officestaff/request-leave"
          element={
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffRequestLeave />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/officestaff/status"
          element={
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <FacultyStatus />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/officestaff/history"
          element={
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffHistory />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/officestaff/stats"
          element={
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffStats />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/officestaff/vacation"
          element={
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffVacation />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/officestaff/profile"
          element={
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <FacultyProfile />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Head Clerk Routes */}
        <Route
          path="/headclerk-dashboard"
          element={
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Principal Routes */}
        <Route
          path="/principal-dashboard"
          element={
            <RequireAuth>
              <RequireRole roles={["principal"]}>
                <PrincipalDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* 404 */}
        <Route path="*" element={<div className="p-6">Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}