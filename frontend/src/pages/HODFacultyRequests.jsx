import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function leaveDays(start, end, leaveType) {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  if (leaveType === "half_day") return 0.5;
  return diff > 0 ? diff : 0;
}

export default function HODFacultyRequests() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/hod/faculty-requests").then((r) => setRows(r.data || []));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.designation, r.leave_category, r.leave_type].join(" ").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.leave_category === "medical") acc.medical += 1;
        if (r.leave_category === "casual") acc.casual += 1;
        if (r.leave_category === "earned") acc.earned += 1;
        return acc;
      },
      { total: 0, medical: 0, casual: 0, earned: 0 }
    );
  }, [filtered]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Faculty Requests (Pending)</h2>

      <div className="bg-white rounded-2xl p-4 shadow">
        <input
          className="border rounded-xl p-3 w-full"
          placeholder="Search by name, email, designation..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Card t="Total Pending" v={summary.total} />
        <Card t="Medical" v={summary.medical} />
        <Card t="Casual" v={summary.casual} />
        <Card t="Earned" v={summary.earned} />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Faculty</th>
              <th>Leave Details</th>
              <th>Duration</th>
              <th>Reason</th>
              <th>Attachment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">
                  <p className="font-semibold">{r.full_name}</p>
                  <p className="text-slate-500">{r.email}</p>
                </td>
                <td>{r.leave_category} / {r.leave_type} / {r.special_leave_type}</td>
                <td>{r.start_date} - {r.end_date} ({leaveDays(r.start_date, r.end_date, r.leave_type)} day)</td>
                <td>{r.reason}</td>
                <td>{r.attachment_path ? <a href={`http://localhost:5000${r.attachment_path}`} target="_blank" className="text-brand-700 underline">View</a> : "-"}</td>
                <td>
                  <Link className="text-brand-700 underline" to={`/hod-admin/faculty-requests/${r.id}`}>Review</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td className="py-3 text-slate-500" colSpan={6}>No pending requests.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ t, v }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <p className="text-slate-500 text-sm">{t}</p>
      <p className="text-2xl font-bold">{v}</p>
    </div>
  );
}