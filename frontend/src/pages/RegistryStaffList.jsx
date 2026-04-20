import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function RegistryStaffList() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const load = () => api.get("/registry/staff-list").then((r) => setRows(r.data || []));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => [r.full_name, r.email, r.designation].join(" ").toLowerCase().includes(s));
  }, [rows, q]);

  const resetPwd = async (username) => {
    if (!confirm(`Reset password for ${username}?`)) return;
    await api.post(`/registry/reset-password/${username}`);
    alert("Password reset to password123");
  };

  const del = async (username) => {
    if (!confirm(`Delete ${username}? Hard delete.`)) return;
    await api.delete(`/registry/delete-staff/${username}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Office Staff List</h2>
        <Link to="/registry-admin/add-staff" className="bg-brand-600 text-white px-4 py-2 rounded-xl">Add New Staff</Link>
      </div>

      <input className="border rounded-xl p-3 w-full bg-white" placeholder="Search by name/email/designation" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Staff</th><th>Contact</th><th>Balances</th><th>History</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.username} className="border-b">
                <td className="py-2">{r.full_name}<div className="text-slate-500">{r.designation}</div></td>
                <td>{r.email}<div>{r.phone_number || "-"}</div></td>
                <td>M:{r.medical_leave_left} C:{r.casual_leave_left} E:{r.earned_leave_left}</td>
                <td>A:{r.approved_count} P:{r.pending_count}</td>
                <td className="space-x-2">
                  <button onClick={() => resetPwd(r.username)} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">Reset</button>
                  <button onClick={() => del(r.username)} className="px-2 py-1 bg-rose-100 text-rose-700 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}