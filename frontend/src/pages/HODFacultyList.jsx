import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function HODFacultyList() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const load = () => api.get("/hod/faculty-list").then((r) => setRows(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.designation].join(" ").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const resetPassword = async (username) => {
    if (!confirm(`Reset password for ${username} to password123?`)) return;
    await api.post(`/hod/reset-password/${username}`);
    alert("Password reset successful.");
  };

  const del = async (username) => {
    if (!confirm(`Delete faculty ${username}? This is HARD delete and cannot be undone.`)) return;
    await api.delete(`/hod/delete-faculty/${username}`);
    alert("Faculty deleted.");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Faculty List</h2>
        <Link to="/hod-admin/add-faculty" className="bg-brand-600 text-white px-4 py-2 rounded-xl">Add New Faculty</Link>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <input
          className="border rounded-xl p-3 w-full"
          placeholder="Search by name, email, designation"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Faculty Details</th>
              <th>Contact</th>
              <th>Type</th>
              <th>Leave Balances</th>
              <th>Leave History</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.username} className="border-b">
                <td className="py-2">
                  <p className="font-semibold">{r.full_name}</p>
                  <p className="text-slate-500">{r.designation || "Faculty"}</p>
                </td>
                <td>
                  <p>{r.email}</p>
                  <p>{r.phone_number || "-"}</p>
                </td>
                <td>{r.designation === "Lab Assistant" ? "Lab Assistant" : "Faculty"}</td>
                <td>
                  <p>M: {r.medical_leave_left}</p>
                  <p>C: {r.casual_leave_left}</p>
                  <p>E: {r.earned_leave_left}</p>
                </td>
                <td>
                  <p>Approved: {r.approved_count}</p>
                  <p>Pending: {r.pending_count}</p>
                </td>
                <td><span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span></td>
                <td className="space-x-2">
                  <button className="px-2 py-1 rounded bg-indigo-100 text-indigo-700" onClick={() => resetPassword(r.username)}>Reset Password</button>
                  <button className="px-2 py-1 rounded bg-rose-100 text-rose-700" onClick={() => del(r.username)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="py-3 text-slate-500">No faculty found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}