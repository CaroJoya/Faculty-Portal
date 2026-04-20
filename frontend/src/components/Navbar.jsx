import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  ListChecks,
  History as HistoryIcon,
  BarChart3,
  User,
  LogOut,
  Users,
  ClipboardList,
  UserPlus,
  CalendarDays,
  CalendarCheck2,
  Upload,
  Sun
} from "lucide-react";

export default function Navbar() {
  const loc = useLocation();
  const navigate = useNavigate();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = user?.role;

  const facultyLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/request-leave", label: "Request Leave", icon: FilePlus2 },
    { to: "/status", label: "Status", icon: ListChecks },
    { to: "/history", label: "History", icon: HistoryIcon },
    { to: "/stats", label: "Stats", icon: BarChart3 },
    { to: "/vacation", label: "Vacation", icon: CalendarDays },
    { to: "/profile", label: "Profile", icon: User }
  ];

  const hodLinks = [
    { to: "/hod-dashboard", label: "HOD Dashboard", icon: LayoutDashboard },
    { to: "/hod/request-leave", label: "My Leave", icon: FilePlus2 },
    { to: "/hod/status", label: "My Status", icon: ListChecks },
    { to: "/hod/history", label: "My History", icon: HistoryIcon },
    { to: "/hod/stats", label: "My Stats", icon: BarChart3 },
    { to: "/vacation", label: "Vacation", icon: CalendarDays },
    { to: "/profile", label: "My Profile", icon: User },
    { to: "/hod-admin/faculty-requests", label: "Faculty Requests", icon: ClipboardList },
    { to: "/hod-admin/faculty-list", label: "Faculty List", icon: Users },
    { to: "/hod-admin/add-faculty", label: "Add Faculty", icon: UserPlus }
  ];

  const registryLinks = [
    { to: "/registry-dashboard", label: "Registry Dashboard", icon: LayoutDashboard },
    { to: "/registry/request-leave", label: "My Leave", icon: FilePlus2 },
    { to: "/registry/status", label: "My Status", icon: ListChecks },
    { to: "/registry/history", label: "My History", icon: HistoryIcon },
    { to: "/registry/stats", label: "My Stats", icon: BarChart3 },
    { to: "/vacation", label: "Vacation", icon: CalendarDays },
    { to: "/profile", label: "My Profile", icon: User },
    { to: "/registry-admin/staff-requests", label: "Staff Requests", icon: ClipboardList },
    { to: "/registry-admin/staff-list", label: "Staff List", icon: Users },
    { to: "/registry-admin/add-staff", label: "Add Staff", icon: UserPlus }
  ];

  const officeStaffLinks = [
    { to: "/officestaff-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/officestaff/request-leave", label: "Request Leave", icon: FilePlus2 },
    { to: "/officestaff/status", label: "Status", icon: ListChecks },
    { to: "/officestaff/history", label: "History", icon: HistoryIcon },
    { to: "/officestaff/stats", label: "Stats", icon: BarChart3 },
    { to: "/vacation", label: "Vacation", icon: CalendarDays },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/officestaff/vacation", label: "Office Vacation", icon: CalendarDays }
  ];

  const headClerkLinks = [
    { to: "/headclerk-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/headclerk/attendance/calendar", label: "Attendance Calendar", icon: CalendarCheck2 },
    { to: "/headclerk/attendance/upload", label: "Upload Attendance", icon: Upload },
    { to: "/headclerk/vacation/manage", label: "Vacation (7-day)", icon: CalendarDays },
    { to: "/headclerk/vacation/summer-winter", label: "Summer/Winter (40-day)", icon: Sun },
    { to: "/headclerk/vacation/calendar", label: "Vacation Calendar", icon: CalendarDays },
    { to: "/headclerk/holidays", label: "Holidays", icon: ClipboardList },
    { to: "/profile", label: "My Profile", icon: User }
  ];

  const principalLinks = [
    { to: "/principal-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/principal/all-pending", label: "All Pending", icon: ClipboardList },
    { to: "/principal/hod-pending", label: "HOD Pending", icon: Users },
    { to: "/principal/profile", label: "My Profile", icon: User }
  ];

  let links = facultyLinks;
  if (role === "hod") links = hodLinks;
  if (role === "registry") links = registryLinks;
  if (role === "officestaff") links = officeStaffLinks;
  if (role === "headclerk") links = headClerkLinks;
  if (role === "principal") links = principalLinks;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const hide = ["/login", "/register", "/forgot-password", "/reset-password"].includes(loc.pathname);
  if (hide) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-indigo-600 bg-clip-text text-transparent">
          Faculty Leave Portal
        </h1>

        <nav className="flex flex-wrap gap-2">
          {links.map((l) => {
            const Icon = l.icon;
            const active = loc.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                  active ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon size={16} />
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="px-3 py-2 rounded-xl text-sm font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}