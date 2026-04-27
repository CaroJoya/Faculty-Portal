import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function RegistryStaffList() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/registry/staff-list");
      setRows(res.data || []);
    } catch (err) {
      console.error("Failed to load staff list", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows.filter(r => !!r.username && !!r.full_name && (showDeleted ? true : !r.deleted));
    return rows.filter((r) => {
      const combined = `${r.full_name} ${r.email} ${r.designation}`.toLowerCase();
      return combined.includes(term) && (showDeleted ? true : !r.deleted);
    });
  }, [rows, q, showDeleted]);

  const resetPwd = async (username) => {
    try {
      await api.post(`/registry/reset-staff-password/${username}`);
      alert("Password reset to password123");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reset password");
    }
  };

  const softDelete = async (username, fullName) => {
    if (!window.confirm(`Delete staff ${fullName}? They can be restored within 30 days.`)) return;
    try {
      await api.delete(`/registry/delete-staff/${username}`);
      alert(`Staff ${fullName} soft deleted successfully.`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete staff");
    }
  };

  const restoreStaff = async (username, fullName) => {
    if (!window.confirm(`Restore staff ${fullName}?`)) return;
    try {
      await api.post(`/registry/restore-staff/${username}`);
      alert(`Staff ${fullName} restored successfully.`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to restore staff");
    }
  };

  const viewHistory = (staff) => {
    setSelectedStaff(staff);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Office Staff List</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-2 rounded-xl ${showDeleted ? "bg-amber-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-slate-200"}`}
          >
            {showDeleted ? "Showing Deleted Staff" : "Show Deleted Staff"}
          </button>
          <Link to="/registry-admin/add-staff" className="bg-brand-600 text-white px-4 py-2 rounded-xl">
            Add New Staff
          </Link>
        </div>
      </div>

      <input
        className="border rounded-xl p-3 w-full bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700"
        placeholder="Search by name/email/designation"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {!showDeleted && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow overflow-auto border border-slate-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-white">Active Staff</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-gray-700">
                <th className="py-2 text-slate-700 dark:text-slate-200">Staff</th>
                <th className="text-slate-700 dark:text-slate-200">Contact</th>
                <th className="text-slate-700 dark:text-slate-200">Balances</th>
                <th className="text-slate-700 dark:text-slate-200">History</th>
                <th className="text-slate-700 dark:text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.username} className="border-b border-slate-100 dark:border-gray-800">
                  <td className="py-2 text-slate-800 dark:text-slate-200">
                    {r.full_name}
                    <div className="text-slate-500 dark:text-slate-400">{r.designation}</div>
                  </td>
                  <td className="text-slate-700 dark:text-slate-300">
                    {r.email}
                    <div className="text-slate-500 dark:text-slate-400">{r.phone_number || "-"}</div>
                  </td>
                  <td className="text-slate-700 dark:text-slate-300">M:{r.medical_leave_left} C:{r.casual_leave_left} E:{r.earned_leave_left}</td>
                  <td className="text-slate-700 dark:text-slate-300">A:{r.approved_count} P:{r.pending_count}</td>
                  <td className="space-x-2">
                    <button onClick={() => resetPwd(r.username)} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded">Reset</button>
                    {!r.deleted ? (
                      <>
                        <button onClick={() => viewHistory(r)} className="px-2 py-1 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-200 rounded">History</button>
                        <button onClick={() => softDelete(r.username, r.full_name)} className="px-2 py-1 bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded">Delete</button>
                      </>
                    ) : (
                      <button onClick={() => restoreStaff(r.username, r.full_name)} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded">Restore</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400">No staff found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Deleted staff view */}
      {showDeleted && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow overflow-auto border border-slate-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-white">Deleted Staff</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-gray-700">
                <th className="py-2 text-slate-700 dark:text-slate-200">Staff</th>
                <th className="text-slate-700 dark:text-slate-200">Deleted On</th>
                <th className="text-slate-700 dark:text-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => r.deleted && (
                <tr key={r.username} className="border-b border-slate-100 dark:border-gray-800">
                  <td className="py-2 text-slate-800 dark:text-slate-200">{r.full_name}</td>
                  <td className="text-slate-700 dark:text-slate-300">{r.deleted_at || "-"}</td>
                  <td>
                    <button onClick={() => restoreStaff(r.username, r.full_name)} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded">Restore</button>
                  </td>
                </tr>
              ))}
              {filtered.filter(r => r.deleted).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-500 dark:text-slate-400">No deleted staff.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}