import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

export default function History() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await api.get("/leave-requests/history", { params: { from, to } });
    setRows(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    let totalDays = 0, med = 0, cas = 0;
    for (const r of rows) {
      const d1 = new Date(r.start_date);
      const d2 = new Date(r.end_date);
      const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      totalDays += r.leave_type === "half_day" ? 0.5 : Math.max(diff, 0);
      if (r.leave_category === "medical") med += 1;
      if (r.leave_category === "casual") cas += 1;
    }
    return { totalLeaves: rows.length, totalDays, med, cas };
  }, [rows]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Approved Leave History</h2>

      <div className="bg-white rounded-2xl p-4 shadow grid md:grid-cols-4 gap-3">
        <input type="date" className="border rounded-xl p-3" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="border rounded-xl p-3" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={load} className="bg-brand-600 text-white rounded-xl px-4 py-2">Apply Filters</button>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Stat label="Total Leaves" value={summary.totalLeaves} />
        <Stat label="Total Days" value={summary.totalDays} />
        <Stat label="Medical Leaves" value={summary.med} />
        <Stat label="Casual Leaves" value={summary.cas} />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Dates</th>
              <th>Category</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Approved At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.start_date} - {r.end_date}</td>
                <td>{r.leave_category}</td>
                <td>{r.leave_type}</td>
                <td>{r.reason}</td>
                <td>{r.approved_at || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}