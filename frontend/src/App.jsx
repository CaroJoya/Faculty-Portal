import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";

// Faculty
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyRequestLeave from "./pages/faculty/RequestLeave";
import FacultyStatus from "./pages/faculty/Status";
import FacultyProfile from "./pages/faculty/Profile";
import FacultyVacation from "./pages/faculty/Vacation";

// Role vacation clones
import OfficeStaffVacation from "./pages/officeStaff/OfficeStaffVacation";
import RegistryVacation from "./pages/registry/RegistryVacation";
import HODVacation from "./pages/hod/HODVacation";

// Head Clerk
import HeadClerkAttendanceCalendar from "./pages/headClerk/HeadClerkAttendanceCalendar";
import HeadClerkVacationManagement from "./pages/headClerk/HeadClerkVacationManagement";

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
        {/* default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/Login" element={<Login />} /> 

        {/* shared */}
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
          path="/vacation"
          element={
            <RequireAuth>
              <FacultyVacation />
            </RequireAuth>
          }
        />

        {/* optional role-specific vacation routes */}
        <Route
          path="/office-staff/vacation"
          element={
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffVacation />
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
          path="/hod/vacation"
          element={
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODVacation />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* head clerk pages */}
        <Route
          path="/headclerk/attendance-calendar"
          element={
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkAttendanceCalendar />
              </RequireRole>
            </RequireAuth>
          }
        />
        <Route
          path="/headclerk/vacation-management"
          element={
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkVacationManagement />
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