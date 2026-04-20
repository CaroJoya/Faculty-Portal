import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ResetPassword() {
  const nav = useNavigate();
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);

  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    try {
      const { data } = await api.post("/reset-password", {
        token,
        new_password: form.new_password,
        confirm_password: form.confirm_password
      });
      setMsg(data.message || "Password reset successful");
      setTimeout(() => nav("/login"), 1000);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-6 shadow space-y-4">
        <h2 className="text-2xl font-bold">Reset Password</h2>
        <input type="password" className="w-full border rounded-xl p-3" placeholder="New password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} required />
        <input type="password" className="w-full border rounded-xl p-3" placeholder="Confirm password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} required />
        <button className="w-full bg-brand-600 text-white py-3 rounded-xl">Reset Password</button>
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        {err && <p className="text-sm text-rose-700">{err}</p>}
        <Link to="/login" className="text-sm text-brand-700 underline">Back to login</Link>
      </form>
    </div>
  );
}