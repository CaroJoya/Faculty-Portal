import { useMemo, useState } from "react";
import api from "../api/axios";

export default function RegistryAddStaff() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    designation: "Office Staff",
    date_of_joining: ""
  });
  const [created, setCreated] = useState(null);
  const [err, setErr] = useState("");

  const usernamePreview = useMemo(() => {
    const e = form.email.trim().toLowerCase();
    if (!e.includes("@")) return "";
    return e.split("@")[0];
  }, [form.email]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setCreated(null);
    try {
      const { data } = await api.post("/registry/add-staff", form);
      setCreated(data.credentials);
      setForm({
        full_name: "",
        email: "",
        phone_number: "",
        designation: "Office Staff",
        date_of_joining: ""
      });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to add staff");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add Office Staff</h2>
      <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow grid md:grid-cols-2 gap-3 border border-slate-200 dark:border-gray-700">
        <input className="border rounded-xl p-3 bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700" placeholder="Full Name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input type="email" className="border rounded-xl p-3 bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border rounded-xl p-3 bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700" placeholder="Phone Number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
        <select className="border rounded-xl p-3 bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}>
          <option>Office Staff</option>
          <option>Clerk</option>
          <option>Administrative Assistant</option>
          <option>Accounts Staff</option>
        </select>
        <input type="date" className="border rounded-xl p-3 md:col-span-2 bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />
        <div className="md:col-span-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 p-3 text-indigo-700 dark:text-indigo-200 text-sm">
          Username: {usernamePreview || "-"} | Password: password123 | Department: Office
        </div>
        {err && <p className="md:col-span-2 text-rose-600 dark:text-rose-400 text-sm">{err}</p>}
        <button className="md:col-span-2 bg-brand-600 text-white py-3 rounded-xl font-semibold">Create Staff Account</button>
      </form>

      {created && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-200 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
          <p className="font-semibold">Created</p>
          <p>Username: {created.username}</p>
          <p>Password: {created.password}</p>
          <p>Department: {created.department}</p>
        </div>
      )}
    </div>
  );
}