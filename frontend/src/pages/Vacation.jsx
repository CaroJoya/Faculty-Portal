import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Vacation() {
  const token = localStorage.getItem("token");
  const [current, setCurrent] = useState({});
  const [remaining, setRemaining] = useState({});
  const [history, setHistory] = useState([]);
  const [calc, setCalc] = useState([]);
  const [form, setForm] = useState({
    vacation_type: "Summer Vacation",
    start_date: "",
    end_date: "",
    reason: ""
  });

  const load = async () => {
    const [c, r, h, cl] = await Promise.all([
      axios.get(`${API}/vacation/summer-winter/current`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/vacation/my-remaining`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/vacation/my-history`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API}/vacation/summer-winter/my-calculations`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setCurrent(c.data || {});
    setRemaining(r.data || {});
    setHistory(h.data || []);
    setCalc(cl.data || []);
  };

  useEffect(() => { load(); }, []);

  const apply = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/vacation/request`, form, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setForm({ vacation_type: "Summer Vacation", start_date: "", end_date: "", reason: "" });
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Vacation</h1>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Active Periods</h2>
          <p className="text-sm"><b>Summer:</b> {current?.summer ? `${current.summer.start_date} → ${current.summer.end_date}` : "Not set"}</p>
          <p className="text-sm"><b>Winter:</b> {current?.winter ? `${current.winter.start_date} → ${current.winter.end_date}` : "Not set"}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Remaining Quota</h2>
          <p className="text-sm"><b>Summer:</b> {remaining?.summer?.remaining ?? 27} / 27</p>
          <p className="text-sm"><b>Winter:</b> {remaining?.winter?.remaining ?? 21} / 21</p>
        </div>
      </div>

      <form onSubmit={apply} className="bg-white p-4 rounded shadow space-y-2">
        <h2 className="font-semibold">Apply Vacation Leave</h2>
        <select className="border rounded px-3 py-2 w-full"
          value={form.vacation_type}
          onChange={(e) => setForm({ ...form, vacation_type: e.target.value })}>
          <option>Summer Vacation</option>
          <option>Winter Vacation</option>
        </select>
        <input type="date" className="border rounded px-3 py-2 w-full"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <input type="date" className="border rounded px-3 py-2 w-full"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        <textarea className="border rounded px-3 py-2 w-full" rows={3}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Reason" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Apply (Auto-Approved)</button>
      </form>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Vacation History</h2>
        <ul className="text-sm space-y-1">
          {history.map((h) => (
            <li key={h.id}>
              {h.special_leave_type}: {h.start_date} → {h.end_date} ({h.duration_days} days) - {h.status}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Earned Leaves from Previous Vacation Calculations</h2>
        <ul className="text-sm space-y-1">
          {calc.map((c) => (
            <li key={c.id}>
              {c.vacation_type}: Remaining {c.remaining_days} → Earned {c.earned_leaves}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}