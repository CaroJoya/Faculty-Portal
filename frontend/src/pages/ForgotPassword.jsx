import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/forgot-password", { email });
      setMessage(data.message || "Reset instructions sent to your email.");
      setEmail("");
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Forgot Password?</h2>
        <p className="text-slate-500 text-sm mb-4">Enter your email address and we'll send you a link to reset your password for PCE Faculty Leave Portal.</p>

        <input
          type="email"
          className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {message && <p className="text-emerald-600 text-sm">{message}</p>}
        {error && <p className="text-rose-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send Reset Link"}
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