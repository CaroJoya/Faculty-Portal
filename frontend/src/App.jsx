import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Welcome from "./pages/Welcome";

// Shared pages
import Dashboard from "./pages/Dashboard";
import RequestLeave from "./pages/RequestLeave";
import Status from "./pages/Status";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Stats from "./pages/Stats";
import Vacation from "./pages/Vacation";

// HOD pages
import HODDashboard from "./pages/HODDashboard";
import HODRequestLeave from "./pages/HODRequestLeave";
import HODRequestDetails from "./pages/HODRequestDetails";
import HODFacultyRequests from "./pages/HODFacultyRequests";
import HODFacultyList from "./pages/HODFacultyList";
import HODAddFaculty from "./pages/HODAddFaculty";
import HODVacation from "./pages/HODVacation";

// Registry pages
import RegistryDashboard from "./pages/RegistryDashboard";
import RegistryRequestLeave from "./pages/RegistryRequestLeave";
import RegistryRequestDetails from "./pages/RegistryRequestDetails";
import RegistryStaffRequests from "./pages/RegistryStaffRequests";
import RegistryStaffList from "./pages/RegistryStaffList";
import RegistryAddStaff from "./pages/RegistryAddStaff";
import RegistryStatus from "./pages/RegistryStatus";
import RegistryStats from "./pages/RegistryStats";
import RegistryHistory from "./pages/RegistryHistory";
import RegistryProfile from "./pages/RegistryProfile";
import RegistryVacation from "./pages/RegistryVacation";

// Office Staff pages
import OfficeStaffDashboard from "./pages/OfficeStaffDashboard";
import OfficeStaffRequestLeave from "./pages/OfficeStaffRequestLeave";
import OfficeStaffStatus from "./pages/OfficeStaffStatus";
import OfficeStaffProfile from "./pages/OfficeStaffProfile";
import OfficeStaffHistory from "./pages/OfficeStaffHistory";
import OfficeStaffStats from "./pages/OfficeStaffStats";
import OfficeStaffVacation from "./pages/OfficeStaffVacation";

// Head Clerk pages
import HeadClerkDashboard from "./pages/HeadClerkDashboard";
import HeadClerkAttendanceCalendar from "./pages/HeadClerkAttendanceCalendar";
import HeadClerkMarkAttendance from "./pages/HeadClerkMarkAttendance";
import HeadClerkVacationCalendar from "./pages/HeadClerkVacationCalendar";
import HeadClerkSummerWinterManagement from "./pages/HeadClerkSummerWinterManagement";

// Principal pages
import PrincipalDashboard from "./pages/PrincipalDashboard";
import PrincipalAllPending from "./pages/PrincipalAllPending";
import PrincipalHODPending from "./pages/PrincipalHODPending";
import PrincipalLayout from "./layouts/PrincipalLayout";

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

// Layout wrapper that conditionally shows navbar
function AppLayout({ children }) {
  const location = window.location.pathname;
  const hideNavbarRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const showNavbar = !hideNavbarRoutes.includes(location);
  
  return (
    <>
      {showNavbar && <Navbar />}
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </>
  );
}

// ---- app ----
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Welcome Page - No Navbar */}
        <Route path="/" element={<Welcome />} />
        
        {/* Auth Routes - No Navbar */}
        <Route path="/login" element={
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
            <Login />
          </main>
        } />
        <Route path="/register" element={
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
            <Register />
          </main>
        } />
        <Route path="/forgot-password" element={
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
            <ForgotPassword />
          </main>
        } />
        <Route path="/reset-password" element={
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
            <ResetPassword />
          </main>
        } />

        {/* Dashboard Redirect */}
        <Route path="/dashboard" element={
          <AppLayout>
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          </AppLayout>
        } />

        {/* ===== SHARED ROUTES (All authenticated users) ===== */}
        <Route path="/request-leave" element={
          <AppLayout>
            <RequireAuth><RequestLeave /></RequireAuth>
          </AppLayout>
        } />
        <Route path="/status" element={
          <AppLayout>
            <RequireAuth><Status /></RequireAuth>
          </AppLayout>
        } />
        <Route path="/profile" element={
          <AppLayout>
            <RequireAuth><Profile /></RequireAuth>
          </AppLayout>
        } />
        <Route path="/history" element={
          <AppLayout>
            <RequireAuth><History /></RequireAuth>
          </AppLayout>
        } />
        <Route path="/stats" element={
          <AppLayout>
            <RequireAuth><Stats /></RequireAuth>
          </AppLayout>
        } />
        <Route path="/vacation" element={
          <AppLayout>
            <RequireAuth><Vacation /></RequireAuth>
          </AppLayout>
        } />

        {/* ===== HOD ROUTES ===== */}
        <Route path="/hod-dashboard" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODDashboard />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod/request-leave" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODRequestLeave />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod/status" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <Status />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod/history" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <History />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod/stats" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <Stats />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod/profile" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <Profile />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod/vacation" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODVacation />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />

        {/* HOD Admin Routes - Faculty Management */}
        <Route path="/hod-admin/faculty-requests" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODFacultyRequests />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod-admin/faculty-requests/:id" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODRequestDetails />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod-admin/faculty-list" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODFacultyList />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/hod-admin/add-faculty" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["hod"]}>
                <HODAddFaculty />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />

        {/* ===== REGISTRY ROUTES ===== */}
        <Route path="/registry-dashboard" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryDashboard />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry/request-leave" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryRequestLeave />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry/status" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryStatus />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry/history" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryHistory />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry/stats" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryStats />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry/profile" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryProfile />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry/vacation" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryVacation />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />

        {/* Registry Admin Routes - Staff Management */}
        <Route path="/registry-admin/staff-requests" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryStaffRequests />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry-admin/staff-requests/:id" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryRequestDetails />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry-admin/staff-list" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryStaffList />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/registry-admin/add-staff" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["registry"]}>
                <RegistryAddStaff />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />

        {/* ===== OFFICE STAFF ROUTES ===== */}
        <Route path="/officestaff-dashboard" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffDashboard />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/officestaff/request-leave" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffRequestLeave />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/officestaff/status" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffStatus />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/officestaff/history" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffHistory />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/officestaff/stats" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffStats />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/officestaff/profile" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffProfile />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/officestaff/vacation" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["officestaff"]}>
                <OfficeStaffVacation />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />

        {/* ===== HEAD CLERK ROUTES ===== */}
        <Route path="/headclerk-dashboard" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkDashboard />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/headclerk/attendance-calendar" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkAttendanceCalendar />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/headclerk/attendance/calendar" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkAttendanceCalendar />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/headclerk/mark-attendance" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkMarkAttendance />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/headclerk/vacation-calendar" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkVacationCalendar />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/headclerk/vacation/calendar" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkVacationCalendar />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/headclerk/summer-winter-management" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkSummerWinterManagement />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/headclerk/vacation/summer-winter" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <HeadClerkSummerWinterManagement />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/headclerk/profile" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["headclerk"]}>
                <Profile />
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />

        {/* ===== PRINCIPAL ROUTES ===== */}
        <Route path="/principal-dashboard" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["principal"]}>
                <PrincipalLayout>
                  <PrincipalDashboard />
                </PrincipalLayout>
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/principal/all-pending" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["principal"]}>
                <PrincipalLayout>
                  <PrincipalAllPending />
                </PrincipalLayout>
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/principal/hod-pending" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["principal"]}>
                <PrincipalLayout>
                  <PrincipalHODPending />
                </PrincipalLayout>
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />
        <Route path="/principal/profile" element={
          <AppLayout>
            <RequireAuth>
              <RequireRole roles={["principal"]}>
                <PrincipalLayout>
                  <Profile />
                </PrincipalLayout>
              </RequireRole>
            </RequireAuth>
          </AppLayout>
        } />

        {/* 404 - Page Not Found */}
        <Route path="*" element={
          <AppLayout>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Page Not Found</h2>
              <p className="text-slate-500 dark:text-slate-400">The page you're looking for doesn't exist.</p>
            </div>
          </AppLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}