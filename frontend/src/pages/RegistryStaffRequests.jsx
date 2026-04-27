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
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Office Staff Requests</h2>
      <input
        className="border rounded-xl p-3 w-full bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700"
        placeholder="Search requests..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow overflow-auto border border-slate-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-gray-700">
              <th className="py-2 text-slate-700 dark:text-slate-200">Staff</th>
              <th className="text-slate-700 dark:text-slate-200">Details</th>
              <th className="text-slate-700 dark:text-slate-200">Duration</th>
              <th className="text-slate-700 dark:text-slate-200">Reason</th>
              <th className="text-slate-700 dark:text-slate-200">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 dark:border-gray-800">
                <td className="py-2 text-slate-800 dark:text-slate-200">{r.full_name}</td>
                <td className="text-slate-700 dark:text-slate-300">{r.leave_category} / {r.leave_type}</td>
                <td className="text-slate-700 dark:text-slate-300">{r.start_date} - {r.end_date}</td>
                <td className="text-slate-700 dark:text-slate-300">{r.reason}</td>
                <td>
                  <Link className="text-brand-700 dark:text-brand-300 underline" to={`/registry-admin/staff-requests/${r.id}`}>Review</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400">No requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}