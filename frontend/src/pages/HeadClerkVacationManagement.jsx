import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HeadClerkVacationManagement() {
  const token = localStorage.getItem("token");
  const [current, setCurrent] = useState({});
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    vacation_type: "Summer Vacation",
    year: new Date().getFullYear(),
    start_date: "",
    end_date: ""
  });
  const [calcPeriodId, setCalcPeriodId] = useState("");

  const load = async () => {
    const [c, s] = await Promise.all([
      axios.get(`${API}/headclerk/summer-winter/current`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/headclerk/vacation/faculty-status`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setCurrent(c.data || {});
    setRows(s.data || []);
  };

  useEffect(() => { load(); }, []);

  const savePeriod = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/headclerk/summer-winter/set`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const runCalc = async () => {
    if (!calcPeriodId) return alert("Enter period ID");
    await axios.post(`${API}/vacation/calculate/${calcPeriodId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert("Calculation complete");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Head Clerk Vacation Management</h1>

      <div className="bg-white p-4 rounded shadow text-sm">
        <p><b>Summer Active:</b> {current?.summer ? `ID:${current.summer.id} | ${current.summer.start_date} → ${current.summer.end_date} | Quota:${current.summer.paid_leave_quota}` : "Not set"}</p>
        <p><b>Winter Active:</b> {current?.winter ? `ID:${current.winter.id} | ${current.winter.start_date} → ${current.winter.end_date} | Quota:${current.winter.paid_leave_quota}` : "Not set"}</p>
      </div>

      <form onSubmit={savePeriod} className="bg-white p-4 rounded shadow space-y-2">
        <h2 className="font-semibold">Set Summer/Winter Period (40 days)</h2>
        <select className="border rounded px-3 py-2 w-full"
          value={form.vacation_type}
          onChange={(e) => setForm({ ...form, vacation_type: e.target.value })}>
          <option>Summer Vacation</option>
          <option>Winter Vacation</option>
        </select>
        <input className="border rounded px-3 py-2 w-full" value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="Year" />
        <input type="date" className="border rounded px-3 py-2 w-full"
          value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <input type="date" className="border rounded px-3 py-2 w-full"
          value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Save Period</button>
      </form>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Run Manual Vacation Calculation</h2>
        <input className="border rounded px-3 py-2 mr-2" placeholder="Period ID" value={calcPeriodId} onChange={(e) => setCalcPeriodId(e.target.value)} />
        <button onClick={runCalc} className="bg-purple-600 text-white px-4 py-2 rounded">Run</button>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Employee</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Summer (used/rem)</th>
              <th className="p-2 text-left">Winter (used/rem)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.username} className="border-t">
                <td className="p-2">{r.full_name}</td>
                <td className="p-2">{r.department}</td>
                <td className="p-2">{r.role}</td>
                <td className="p-2">{r.summer_used}/{r.summer_remaining}</td>
                <td className="p-2">{r.winter_used}/{r.winter_remaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}