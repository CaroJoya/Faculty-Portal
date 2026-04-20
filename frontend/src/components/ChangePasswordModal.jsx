import { useState } from "react";
import api from "../api/axios";

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (form.new_password !== form.confirm_password) {
      setErr("New password and confirm password do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/change-password", {
        current_password: form.current_password,
        new_password: form.new_password
      });
      setMsg(data.message || "Password changed");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl p-5 space-y-3">
        <h3 className="text-xl font-bold">Change Password</h3>

        <input
          type="password"
          className="w-full border rounded-xl p-3"
          placeholder="Current password"
          value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          required
        />
        <input
          type="password"
          className="w-full border rounded-xl p-3"
          placeholder="New password (min 6)"
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          required
        />
        <input
          type="password"
          className="w-full border rounded-xl p-3"
          placeholder="Confirm new password"
          value={form.confirm_password}
          onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
          required
        />

        {msg && <p className="text-emerald-700 text-sm">{msg}</p>}
        {err && <p className="text-rose-700 text-sm">{err}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 border rounded-xl py-2">
            Close
          </button>
          <button disabled={loading} className="flex-1 bg-brand-600 text-white rounded-xl py-2">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}