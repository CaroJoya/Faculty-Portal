import { useEffect, useState } from "react";
import api from "../api/axios";

export default function HeadClerkVacationManagement() {
  const [form, setForm] = useState({ period_name: "Summer Vacation", start_date: "", end_date: "" });
  const [active, setActive] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [p, f] = await Promise.all([
      api.get("/headclerk/vacation/periods"),
      api.get("/headclerk/vacation/faculty-status")
    ]);
    setActive(p.data.active_period);
    setFaculty(f.data || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/headclerk/vacation/set-period", form);
      setMsg("Vacation period set successfully");
      load();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-white rounded-2xl p-5 shadow grid md:grid-cols-2 gap-3">
        <h2 className="md:col-span-2 text-2xl font-bold">7-Day Personal Vacation Period</h2>
        <select className="border rounded-xl p-3" value={form.period_name} onChange={(e) => setForm({ ...form, period_name: e.target.value })}>
          <option>Summer Vacation</option>
          <option>Winter Vacation</option>
        </select>
        <input type="date" className="border rounded-xl p-3" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
        <input type="date" className="border rounded-xl p-3" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
        <button className="bg-brand-600 text-white rounded-xl p-3">Set Period</button>
      </form>

      {active && (
        <div className="bg-indigo-50 text-indigo-800 rounded-xl p-4">
          Active: <b>{active.period_name}</b> ({active.start_date} to {active.end_date})
        </div>
      )}

      {msg && <p className="text-sm text-indigo-700">{msg}</p>}

      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <h3 className="text-lg font-bold mb-2">Faculty Vacation Status</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Name</th><th>Department</th><th>Used</th><th>Remaining</th><th>Status</th></tr></thead>
          <tbody>
            {faculty.map((f) => {
              const status = f.vacation_days_used === 0 ? "No Leaves" : (f.vacation_days_remaining === 0 ? "All Used" : "Active");
              return (
                <tr key={f.username} className="border-b">
                  <td className="py-2">{f.full_name}</td>
                  <td>{f.department}</td>
                  <td>{f.vacation_days_used}</td>
                  <td>{f.vacation_days_remaining}</td>
                  <td>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}