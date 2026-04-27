import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
  Sun,
  Menu,
  X,
  Moon,
  ShieldCheck,
  Building2,
  GraduationCap
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = user?.role;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide navbar on welcome page
  if (loc.pathname === "/") {
    return null;
  }

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
    { to: "/hod-dashboard", label: "Dashboard", icon: LayoutDashboard },
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
    { to: "/registry-dashboard", label: "Dashboard", icon: LayoutDashboard },
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
    { to: "/profile", label: "Profile", icon: User }
  ];

  // Head Clerk - removed Holidays, Upload Attendance, Vacation-7 Days
  const headClerkLinks = [
    { to: "/headclerk-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/headclerk/attendance/calendar", label: "Attendance Calendar", icon: CalendarDays },
    { to: "/headclerk/vacation/summer-winter", label: "Summer/Winter (40-day)", icon: Sun },
    { to: "/headclerk/vacation/calendar", label: "Vacation Calendar", icon: CalendarDays },
    { to: "/profile", label: "My Profile", icon: User }
  ];

  const principalLinks = [
    { to: "/principal-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/principal/all-pending", label: "All Pending", icon: ClipboardList },
    { to: "/principal/hod-pending", label: "HOD Pending", icon: Users },
    { to: "/principal/profile", label: "My Profile", icon: User }
  ];

  let links = facultyLinks;
  let roleBadge = "";
  let roleIcon = null;

  if (role === "hod") {
    links = hodLinks;
    roleBadge = "HOD";
    roleIcon = <ShieldCheck className="w-4 h-4" />;
  } else if (role === "registry") {
    links = registryLinks;
    roleBadge = "Registry";
    roleIcon = <Building2 className="w-4 h-4" />;
  } else if (role === "officestaff") {
    links = officeStaffLinks;
    roleBadge = "Office Staff";
    roleIcon = <GraduationCap className="w-4 h-4" />;
  } else if (role === "headclerk") {
    links = headClerkLinks;
    roleBadge = "Head Clerk";
    roleIcon = <ShieldCheck className="w-4 h-4" />;
  } else if (role === "principal") {
    links = principalLinks;
    roleBadge = "Principal";
    roleIcon = <ShieldCheck className="w-4 h-4" />;
  } else {
    roleBadge = "Faculty";
    roleIcon = <GraduationCap className="w-4 h-4" />;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const hide = ["/login", "/register", "/forgot-password", "/reset-password"].includes(loc.pathname);
  if (hide) return null;

  const NavLinks = ({ mobile = false }) => (
    <>
      {links.map((l) => {
        const Icon = l.icon;
        const active = loc.pathname === l.to;
        return (
          <Link
            key={l.to}
            to={l.to}
            onClick={() => setMobileMenuOpen(false)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${mobile ? "w-full" : ""}
              ${active 
                ? "bg-brand-600 text-white shadow-md" 
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800"
              }
            `}
          >
            <Icon size={18} />
            {l.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Navbar */}
      <header className={`
        sticky top-0 z-50 transition-all duration-300
        ${scrolled 
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg" 
          : "bg-white dark:bg-gray-900 shadow-sm"
        }
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              {/* Use college logo image instead of gradient icon */}
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white">
                <img
                  src="/college-logo.png"
                  alt="PCE College Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to icon if image missing
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-indigo-700 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  PCE faculty leave portal
                </h1>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  {roleIcon}
                  <span>{roleBadge}</span>
                  <span className="mx-1">•</span>
                  <span>{user?.full_name?.split(" ")[0] || user?.username}</span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLinks mobile={false} />
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {/* Logout Button (Desktop) */}
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition-all duration-200 text-sm font-medium"
              >
                <LogOut size={16} />
                Logout
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white">
                    <img
                      src="/college-logo.png"
                      alt="PCE College Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg dark:text-white">Menu</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.full_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                <NavLinks mobile={true} />
              </nav>
              <div className="pt-4 border-t border-slate-200 dark:border-gray-800">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-sm font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}