import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RequestLeave from "./pages/RequestLeave";
import Status from "./pages/Status";
import History from "./pages/History";
import Stats from "./pages/Stats";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Navbar from "./components/Navbar";

// auth recovery
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// shared vacation page
import Vacation from "./pages/Vacation";

// HOD pages
import HODDashboard from "./pages/HODDashboard";
import HODRequestLeave from "./pages/HODRequestLeave";
import HODFacultyRequests from "./pages/HODFacultyRequests";
import HODRequestDetails from "./pages/HODRequestDetails";
import HODFacultyList from "./pages/HODFacultyList";
import HODAddFaculty from "./pages/HODAddFaculty";

// Registry pages
import RegistryDashboard from "./pages/RegistryDashboard";
import RegistryRequestLeave from "./pages/RegistryRequestLeave";
import RegistryStatus from "./pages/RegistryStatus";
import RegistryHistory from "./pages/RegistryHistory";
import RegistryStats from "./pages/RegistryStats";
import RegistryProfile from "./pages/RegistryProfile";
import RegistryStaffRequests from "./pages/RegistryStaffRequests";
import RegistryRequestDetails from "./pages/RegistryRequestDetails";
import RegistryStaffList from "./pages/RegistryStaffList";
import RegistryAddStaff from "./pages/RegistryAddStaff";

// Office Staff pages
import OfficeStaffDashboard from "./pages/OfficeStaffDashboard";
import OfficeStaffRequestLeave from "./pages/OfficeStaffRequestLeave";
import OfficeStaffStatus from "./pages/OfficeStaffStatus";
import OfficeStaffHistory from "./pages/OfficeStaffHistory";
import OfficeStaffStats from "./pages/OfficeStaffStats";
import OfficeStaffProfile from "./pages/OfficeStaffProfile";
import OfficeStaffVacation from "./pages/OfficeStaffVacation";

// Head Clerk pages
import HeadClerkDashboard from "./pages/HeadClerkDashboard";
import HeadClerkAttendanceCalendar from "./pages/HeadClerkAttendanceCalendar";
import HeadClerkUploadAttendance from "./pages/HeadClerkUploadAttendance";
import HeadClerkVacationManagement from "./pages/HeadClerkVacationManagement";
import HeadClerkSummerWinterManagement from "./pages/HeadClerkSummerWinterManagement";
import HeadClerkVacationCalendar from "./pages/HeadClerkVacationCalendar";
import HeadClerkHolidays from "./pages/HeadClerkHolidays";

// Principal pages
import PrincipalDashboard from "./pages/PrincipalDashboard";
import PrincipalAllPending from "./pages/PrincipalAllPending";
import PrincipalHODPending from "./pages/PrincipalHODPending";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Faculty */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/request-leave" element={<ProtectedRoute><Layout><RequestLeave /></Layout></ProtectedRoute>} />
      <Route path="/status" element={<ProtectedRoute><Layout><Status /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><Layout><Stats /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      <Route path="/vacation" element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={["faculty", "hod", "registry", "officestaff"]}>
            <Layout><Vacation /></Layout>
          </RoleRoute>
        </ProtectedRoute>
      } />

      {/* HOD */}
      <Route path="/hod-dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><HODDashboard /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod/request-leave" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><HODRequestLeave /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod/status" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><Status /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod/history" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><History /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod/stats" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><Stats /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod/profile" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><Profile /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod-admin/faculty-requests" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><HODFacultyRequests /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod-admin/faculty-requests/:id" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><HODRequestDetails /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod-admin/faculty-list" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><HODFacultyList /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/hod-admin/add-faculty" element={<ProtectedRoute><RoleRoute allowedRoles={["hod"]}><Layout><HODAddFaculty /></Layout></RoleRoute></ProtectedRoute>} />

      {/* Registry */}
      <Route path="/registry-dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryDashboard /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry/request-leave" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryRequestLeave /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry/status" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryStatus /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry/history" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryHistory /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry/stats" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryStats /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry/profile" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><Profile /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry-admin/staff-requests" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryStaffRequests /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry-admin/staff-requests/:id" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryRequestDetails /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry-admin/staff-list" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryStaffList /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/registry-admin/add-staff" element={<ProtectedRoute><RoleRoute allowedRoles={["registry"]}><Layout><RegistryAddStaff /></Layout></RoleRoute></ProtectedRoute>} />

      {/* Office Staff */}
      <Route path="/officestaff-dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={["officestaff"]}><Layout><OfficeStaffDashboard /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/officestaff/request-leave" element={<ProtectedRoute><RoleRoute allowedRoles={["officestaff"]}><Layout><OfficeStaffRequestLeave /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/officestaff/status" element={<ProtectedRoute><RoleRoute allowedRoles={["officestaff"]}><Layout><OfficeStaffStatus /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/officestaff/history" element={<ProtectedRoute><RoleRoute allowedRoles={["officestaff"]}><Layout><OfficeStaffHistory /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/officestaff/stats" element={<ProtectedRoute><RoleRoute allowedRoles={["officestaff"]}><Layout><OfficeStaffStats /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/officestaff/profile" element={<ProtectedRoute><RoleRoute allowedRoles={["officestaff"]}><Layout><Profile /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/officestaff/vacation" element={<ProtectedRoute><RoleRoute allowedRoles={["officestaff"]}><Layout><OfficeStaffVacation /></Layout></RoleRoute></ProtectedRoute>} />

      {/* Head Clerk */}
      <Route path="/headclerk-dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={["headclerk"]}><Layout><HeadClerkDashboard /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/headclerk/attendance/calendar" element={<ProtectedRoute><RoleRoute allowedRoles={["headclerk"]}><Layout><HeadClerkAttendanceCalendar /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/headclerk/attendance/upload" element={<ProtectedRoute><RoleRoute allowedRoles={["headclerk"]}><Layout><HeadClerkUploadAttendance /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/headclerk/vacation/manage" element={<ProtectedRoute><RoleRoute allowedRoles={["headclerk"]}><Layout><HeadClerkVacationManagement /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/headclerk/vacation/summer-winter" element={<ProtectedRoute><RoleRoute allowedRoles={["headclerk"]}><Layout><HeadClerkSummerWinterManagement /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/headclerk/vacation/calendar" element={<ProtectedRoute><RoleRoute allowedRoles={["headclerk"]}><Layout><HeadClerkVacationCalendar /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/headclerk/holidays" element={<ProtectedRoute><RoleRoute allowedRoles={["headclerk"]}><Layout><HeadClerkHolidays /></Layout></RoleRoute></ProtectedRoute>} />
      <Route path="/headclerk/profile" element={<ProtectedRoute><RoleRoute allowedRoles={["headclerk"]}><Layout><Profile /></Layout></RoleRoute></ProtectedRoute>} />

      {/* Principal */}
      <Route path="/principal-dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={["principal"]}><PrincipalDashboard /></RoleRoute></ProtectedRoute>} />
      <Route path="/principal/all-pending" element={<ProtectedRoute><RoleRoute allowedRoles={["principal"]}><PrincipalAllPending /></RoleRoute></ProtectedRoute>} />
      <Route path="/principal/hod-pending" element={<ProtectedRoute><RoleRoute allowedRoles={["principal"]}><PrincipalHODPending /></RoleRoute></ProtectedRoute>} />
      <Route path="/principal/profile" element={<ProtectedRoute><RoleRoute allowedRoles={["principal"]}><Layout><Profile /></Layout></RoleRoute></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}