import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/login", form);

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("Login successful. User role:", data.user?.role);
      console.log("Full user data:", data.user);

      // Redirect based on role
      const role = data.user?.role;
      
      if (role === "hod") {
        navigate("/hod-dashboard", { replace: true });
      } else if (role === "registry") {
        navigate("/registry-dashboard", { replace: true });
      } else if (role === "officestaff") {
        navigate("/officestaff-dashboard", { replace: true });
      } else if (role === "headclerk") {
        navigate("/headclerk-dashboard", { replace: true });
      } else if (role === "principal") {
        console.log("Redirecting to principal dashboard");
        navigate("/principal-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
        <p className="text-slate-500 mb-6">Login to PCE Faculty Leave Portal</p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username Field */}
          <input 
            className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-400" 
            placeholder="Username" 
            value={form.username} 
            onChange={(e) => setForm({ ...form, username: e.target.value })} 
            required 
          />

          {/* Password Field with Toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-slate-300 rounded-xl p-3 pr-10 outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-brand-600 hover:text-brand-700 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {error && <p className="text-rose-600 text-sm">{error}</p>}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Removed self-signup link: new users should not be able to create accounts */}
      </div>
    </div>
  );
}