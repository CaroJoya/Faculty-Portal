import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
    department: "",
    designation: "Faculty",
    role: "faculty",
    phone_number: ""
  });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const { data } = await api.post("/register", form);
      setOk(data.message || "Registered successfully");
      setTimeout(() => nav("/login"), 1000);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-100 via-white to-brand-100 p-4">
      <form onSubmit={submit} className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-6 grid gap-3 md:grid-cols-2">
        <h2 className="text-2xl font-bold text-slate-800 md:col-span-2">Create Account - PCE Faculty Leave Portal</h2>

        <input className="border rounded-xl p-3" placeholder="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="border rounded-xl p-3" type="password" placeholder="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="border rounded-xl p-3 md:col-span-2" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border rounded-xl p-3" placeholder="Full Name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className="border rounded-xl p-3" placeholder="Department" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        <input className="border rounded-xl p-3" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        <input className="border rounded-xl p-3" placeholder="Phone Number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />

        <select className="border rounded-xl p-3 md:col-span-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="faculty">faculty</option>
          <option value="hod">hod</option>
          <option value="principal">principal</option>
          <option value="registry">registry</option>
          <option value="headclerk">headclerk</option>
          <option value="officestaff">officestaff</option>
        </select>

        {err && <p className="text-rose-600 text-sm md:col-span-2">{err}</p>}
        {ok && <p className="text-emerald-600 text-sm md:col-span-2">{ok}</p>}

        <button disabled={loading} className="md:col-span-2 bg-brand-600 text-white py-3 rounded-xl font-semibold">
          {loading ? "Creating..." : "Register"}
        </button>

        <p className="md:col-span-2 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="text-brand-700 font-semibold" to="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}