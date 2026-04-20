import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/forgot-password", { email });
      setMsg(data.message || "If the email exists, reset instructions were sent.");
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Request failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-6 shadow space-y-4">
        <h2 className="text-2xl font-bold">Forgot Password</h2>
        <input type="email" className="w-full border rounded-xl p-3" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="w-full bg-brand-600 text-white py-3 rounded-xl">Send Reset Link</button>
        {msg && <p className="text-sm text-slate-700">{msg}</p>}
        <Link to="/login" className="text-sm text-brand-700 underline">Back to login</Link>
      </form>
    </div>
  );
}