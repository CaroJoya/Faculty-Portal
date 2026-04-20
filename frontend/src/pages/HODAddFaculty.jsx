import { useMemo, useState } from "react";
import api from "../api/axios";

export default function HODAddFaculty() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    account_type: "Faculty",
    date_of_joining: ""
  });
  const [created, setCreated] = useState(null);
  const [err, setErr] = useState("");

  const usernamePreview = useMemo(() => {
    const email = form.email.trim().toLowerCase();
    if (!email.includes("@")) return "";
    return email.split("@")[0];
  }, [form.email]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setCreated(null);
    try {
      const { data } = await api.post("/hod/add-faculty", form);
      setCreated(data.credentials);
      setForm({
        full_name: "",
        email: "",
        phone_number: "",
        account_type: "Faculty",
        date_of_joining: ""
      });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to add faculty");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Add New Faculty</h2>

      <form onSubmit={submit} className="bg-white rounded-2xl p-5 shadow grid md:grid-cols-2 gap-3">
        <input className="border rounded-xl p-3" placeholder="Full Name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input type="email" className="border rounded-xl p-3" placeholder="Email Address" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="border rounded-xl p-3" placeholder="Phone Number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
        <select className="border rounded-xl p-3" value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}>
          <option>Faculty</option>
          <option>Lab Assistant</option>
        </select>
        <input type="date" className="border rounded-xl p-3 md:col-span-2" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />

        <div className="md:col-span-2 rounded-xl bg-indigo-50 text-indigo-700 p-3 text-sm">
          <p><b>Username:</b> {usernamePreview || "-"}</p>
          <p><b>Password:</b> password123</p>
          <p><b>Department:</b> Auto-assigned from current HOD</p>
        </div>

        {err && <p className="md:col-span-2 text-rose-600 text-sm">{err}</p>}

        <button className="md:col-span-2 bg-brand-600 text-white py-3 rounded-xl font-semibold">Create Faculty Account</button>
      </form>

      {created && (
        <div className="bg-emerald-50 text-emerald-800 rounded-2xl p-4">
          <h3 className="font-bold mb-2">Faculty created successfully</h3>
          <p><b>Username:</b> {created.username}</p>
          <p><b>Password:</b> {created.password}</p>
          <p><b>Department:</b> {created.department}</p>
        </div>
      )}
    </div>
  );
}