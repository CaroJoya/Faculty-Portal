import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const { data } = await api.post("/login", form);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = data?.user?.role;
      if (role === "hod") return nav("/hod-dashboard", { replace: true });
      if (role === "registry") return nav("/registry-dashboard", { replace: true });
      if (role === "officestaff") return nav("/officestaff-dashboard", { replace: true });
      if (role === "headclerk") return nav("/headclerk-dashboard", { replace: true });
      if (role === "principal") return nav("/principal-dashboard", { replace: true });
      
      return nav("/dashboard", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || `Login failed (${e2?.response?.status || "no-status"})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
        <p className="text-slate-500 mb-6">Login to Faculty Leave Portal</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <input className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-400" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input type="password" className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-400" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {err && <p className="text-rose-600 text-sm">{err}</p>}
          <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-70">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-5">
          New user?{" "}
          <Link className="text-brand-700 font-semibold hover:underline" to="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}