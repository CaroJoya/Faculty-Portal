import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function RegistryStaffRequests() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/registry/staff-requests").then((r) => setRows(r.data || []));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => [r.full_name, r.email, r.leave_category, r.leave_type].join(" ").toLowerCase().includes(s));
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Office Staff Requests</h2>
      <input className="border rounded-xl p-3 w-full bg-white" placeholder="Search requests..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Staff</th><th>Details</th><th>Duration</th><th>Reason</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.full_name}</td>
                <td>{r.leave_category} / {r.leave_type}</td>
                <td>{r.start_date} - {r.end_date}</td>
                <td>{r.reason}</td>
                <td><Link className="text-brand-700 underline" to={`/registry-admin/staff-requests/${r.id}`}>Review</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}