import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({
    new_password: "",
    confirm_password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError("No reset token provided. Please request a new password reset.");
    }
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (form.new_password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/reset-password", {
        token,
        new_password: form.new_password,
        confirm_password: form.confirm_password
      });
      setMessage(data.message || "Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid or expired reset token");
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-rose-600 mb-4">Invalid Reset Link</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link to="/forgot-password" className="inline-block bg-brand-600 text-white px-6 py-2 rounded-xl">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Create New Password</h2>
        <p className="text-slate-500 text-sm mb-4">Enter your new password below.</p>

        {/* New Password Field */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full border border-slate-300 rounded-xl p-3 pr-10 outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="New password (min 6 characters)"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Confirm Password Field */}
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="w-full border border-slate-300 rounded-xl p-3 pr-10 outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="Confirm password"
            value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {message && <p className="text-emerald-600 text-sm">{message}</p>}
        {error && <p className="text-rose-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-70"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="text-center text-sm text-slate-600">
          <Link className="text-brand-700 hover:underline" to="/login">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}