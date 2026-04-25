import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  User, 
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function PrincipalLayout({ children }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const navItems = [
    { to: "/principal-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/principal/all-pending", label: "All Pending", icon: ClipboardList },
    { to: "/principal/hod-pending", label: "HOD Pending", icon: Users },
    { to: "/principal/profile", label: "My Profile", icon: User }
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
            {/* Profile Section */}
            <div className="p-5 text-center border-b border-slate-200 dark:border-gray-700 bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-950/30 dark:to-indigo-950/30">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {user?.full_name?.charAt(0) || "P"}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-slate-800 dark:text-white">
                {user?.full_name || "Principal"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Principal • {user?.department || "Administration"}
              </p>
            </div>

            {/* Navigation */}
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = loc.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-brand-600 text-white shadow-md"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Theme Toggle & Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-gray-700 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-all"
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}