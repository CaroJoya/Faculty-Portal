import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

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

// Head Clerk pages (removed: UploadAttendance, Holidays)
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

// ---- app ----
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* ===== SHARED ROUTES (All authenticated users) ===== */}
            <Route 
              path="/dashboard" 
              element={<RequireAuth><Dashboard /></RequireAuth>} 
            />
            <Route 
              path="/request-leave" 
              element={<RequireAuth><RequestLeave /></RequireAuth>} 
            />
            <Route 
              path="/status" 
              element={<RequireAuth><Status /></RequireAuth>} 
            />
            <Route 
              path="/profile" 
              element={<RequireAuth><Profile /></RequireAuth>} 
            />
            <Route 
              path="/history" 
              element={<RequireAuth><History /></RequireAuth>} 
            />
            <Route 
              path="/stats" 
              element={<RequireAuth><Stats /></RequireAuth>} 
            />
            <Route 
              path="/vacation" 
              element={<RequireAuth><Vacation /></RequireAuth>} 
            />

            {/* ===== HOD ROUTES ===== */}
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
                    <Status />
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
              path="/hod/profile" 
              element={
                <RequireAuth>
                  <RequireRole roles={["hod"]}>
                    <Profile />
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

            {/* HOD Admin Routes - Faculty Management */}
            <Route 
              path="/hod-admin/faculty-requests" 
              element={
                <RequireAuth>
                  <RequireRole roles={["hod"]}>
                    <HODFacultyRequests />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/hod-admin/faculty-requests/:id" 
              element={
                <RequireAuth>
                  <RequireRole roles={["hod"]}>
                    <HODRequestDetails />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/hod-admin/faculty-list" 
              element={
                <RequireAuth>
                  <RequireRole roles={["hod"]}>
                    <HODFacultyList />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/hod-admin/add-faculty" 
              element={
                <RequireAuth>
                  <RequireRole roles={["hod"]}>
                    <HODAddFaculty />
                  </RequireRole>
                </RequireAuth>
              } 
            />

            {/* ===== REGISTRY ROUTES ===== */}
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
                    <RegistryStatus />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/registry/history" 
              element={
                <RequireAuth>
                  <RequireRole roles={["registry"]}>
                    <RegistryHistory />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/registry/stats" 
              element={
                <RequireAuth>
                  <RequireRole roles={["registry"]}>
                    <RegistryStats />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/registry/profile" 
              element={
                <RequireAuth>
                  <RequireRole roles={["registry"]}>
                    <RegistryProfile />
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

            {/* Registry Admin Routes - Staff Management */}
            <Route 
              path="/registry-admin/staff-requests" 
              element={
                <RequireAuth>
                  <RequireRole roles={["registry"]}>
                    <RegistryStaffRequests />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/registry-admin/staff-requests/:id" 
              element={
                <RequireAuth>
                  <RequireRole roles={["registry"]}>
                    <RegistryRequestDetails />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/registry-admin/staff-list" 
              element={
                <RequireAuth>
                  <RequireRole roles={["registry"]}>
                    <RegistryStaffList />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/registry-admin/add-staff" 
              element={
                <RequireAuth>
                  <RequireRole roles={["registry"]}>
                    <RegistryAddStaff />
                  </RequireRole>
                </RequireAuth>
              } 
            />

            {/* ===== OFFICE STAFF ROUTES ===== */}
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
                    <OfficeStaffStatus />
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
              path="/officestaff/profile" 
              element={
                <RequireAuth>
                  <RequireRole roles={["officestaff"]}>
                    <OfficeStaffProfile />
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

            {/* ===== HEAD CLERK ROUTES (Removed: upload-attendance, holidays, vacation-7day) ===== */}
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
            
            {/* Attendance Routes */}
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
              path="/headclerk/attendance/calendar" 
              element={
                <RequireAuth>
                  <RequireRole roles={["headclerk"]}>
                    <HeadClerkAttendanceCalendar />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/headclerk/mark-attendance" 
              element={
                <RequireAuth>
                  <RequireRole roles={["headclerk"]}>
                    <HeadClerkMarkAttendance />
                  </RequireRole>
                </RequireAuth>
              } 
            />

            {/* Vacation Routes - only Summer/Winter */}
            <Route 
              path="/headclerk/vacation-calendar" 
              element={
                <RequireAuth>
                  <RequireRole roles={["headclerk"]}>
                    <HeadClerkVacationCalendar />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/headclerk/vacation/calendar" 
              element={
                <RequireAuth>
                  <RequireRole roles={["headclerk"]}>
                    <HeadClerkVacationCalendar />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/headclerk/summer-winter-management" 
              element={
                <RequireAuth>
                  <RequireRole roles={["headclerk"]}>
                    <HeadClerkSummerWinterManagement />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/headclerk/vacation/summer-winter" 
              element={
                <RequireAuth>
                  <RequireRole roles={["headclerk"]}>
                    <HeadClerkSummerWinterManagement />
                  </RequireRole>
                </RequireAuth>
              } 
            />
            
            {/* Profile */}
            <Route 
              path="/headclerk/profile" 
              element={
                <RequireAuth>
                  <RequireRole roles={["headclerk"]}>
                    <Profile />
                  </RequireRole>
                </RequireAuth>
              } 
            />

            {/* ===== PRINCIPAL ROUTES ===== */}
            <Route 
              path="/principal-dashboard" 
              element={
                <RequireAuth>
                  <RequireRole roles={["principal"]}>
                    <PrincipalLayout>
                      <PrincipalDashboard />
                    </PrincipalLayout>
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/principal/all-pending" 
              element={
                <RequireAuth>
                  <RequireRole roles={["principal"]}>
                    <PrincipalLayout>
                      <PrincipalAllPending />
                    </PrincipalLayout>
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/principal/hod-pending" 
              element={
                <RequireAuth>
                  <RequireRole roles={["principal"]}>
                    <PrincipalLayout>
                      <PrincipalHODPending />
                    </PrincipalLayout>
                  </RequireRole>
                </RequireAuth>
              } 
            />
            <Route 
              path="/principal/profile" 
              element={
                <RequireAuth>
                  <RequireRole roles={["principal"]}>
                    <PrincipalLayout>
                      <Profile />
                    </PrincipalLayout>
                  </RequireRole>
                </RequireAuth>
              } 
            />

            {/* 404 - Page Not Found */}
            <Route 
              path="*" 
              element={
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Page Not Found</h2>
                  <p className="text-slate-500 dark:text-slate-400">The page you're looking for doesn't exist.</p>
                </div>
              } 
            />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}