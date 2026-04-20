import { Link, useLocation, useNavigate } from "react-router-dom";

export default function PrincipalLayout({ children }) {
  const loc = useLocation();
  const nav = useNavigate();

  const links = [
    { to: "/principal-dashboard", label: "Dashboard" },
    { to: "/principal/all-pending", label: "All Pending Leaves" },
    { to: "/principal/hod-pending", label: "HOD Leaves" },
    { to: "/principal/profile", label: "My Profile" }
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    nav("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 grid md:grid-cols-[240px_1fr] gap-4">
        <aside className="bg-white rounded-2xl p-4 shadow h-fit sticky top-4">
          <h2 className="text-xl font-bold mb-4">Principal Panel</h2>
          <div className="space-y-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`block px-3 py-2 rounded-xl text-sm ${
                  loc.pathname === l.to ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <button onClick={logout} className="mt-4 w-full px-3 py-2 rounded-xl bg-rose-100 text-rose-700">
            Logout
          </button>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}