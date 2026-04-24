import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function RegistryStaffList() {
  const [rows, setRows] = useState([]);
  const [deletedRows, setDeletedRows] = useState([]);
  const [q, setQ] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const load = () => {
    api.get("/registry/staff-list").then((r) => setRows(r.data || []));
    api.get("/registry/deleted-staff-history").then((r) => setDeletedRows(r.data?.deleted_staff || []));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.designation].join(" ").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const resetPwd = async (username) => {
    if (!confirm(`Reset password for ${username}?`)) return;
    try {
      await api.post(`/registry/reset-password/${username}`);
      alert("Password reset to password123");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reset password");
    }
  };

  const softDelete = async (username, fullName) => {
    if (!confirm(`Delete staff ${fullName}? They can be restored within 30 days.`)) return;
    try {
      await api.delete(`/registry/delete-staff/${username}`);
      alert(`Staff ${fullName} soft deleted successfully.`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete staff");
    }
  };

  const restoreStaff = async (username, fullName) => {
    if (!confirm(`Restore staff ${fullName}?`)) return;
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
        <h2 className="text-2xl font-bold">Office Staff List</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-2 rounded-xl ${showDeleted ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {showDeleted ? "Showing Deleted" : "Show Deleted Staff"}
          </button>
          <Link to="/registry-admin/add-staff" className="bg-brand-600 text-white px-4 py-2 rounded-xl">
            Add New Staff
          </Link>
        </div>
      </div>

      <input className="border rounded-xl p-3 w-full bg-white" placeholder="Search by name/email/designation" value={q} onChange={(e) => setQ(e.target.value)} />

      {/* Active Staff Table */}
      {!showDeleted && (
        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <h3 className="font-bold text-lg mb-3">Active Staff</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Staff</th>
                <th>Contact</th>
                <th>Balances</th>
                <th>History</th>
                <th>Actions</th>
               </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.username} className="border-b">
                  <td className="py-2">
                    {r.full_name}
                    <div className="text-slate-500">{r.designation}</div>
                   </td>
                  <td>
                    {r.email}
                    <div>{r.phone_number || "-"}</div>
                   </td>
                  <td>M:{r.medical_leave_left} C:{r.casual_leave_left} E:{r.earned_leave_left}</td>
                  <td>A:{r.approved_count} P:{r.pending_count}</td>
                  <td className="space-x-2">
                    <button onClick={() => resetPwd(r.username)} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">Reset</button>
                    <button onClick={() => softDelete(r.username, r.full_name)} className="px-2 py-1 bg-rose-100 text-rose-700 rounded">Delete</button>
                    <button onClick={() => viewHistory(r)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">History</button>
                   </td>
                 </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="py-3 text-slate-500">No active staff found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Deleted Staff Table */}
      {showDeleted && (
        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <h3 className="font-bold text-lg mb-3">Deleted Staff (Restorable within 30 days)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Staff Details</th>
                <th>Deleted By</th>
                <th>Deleted At</th>
                <th>Restored At</th>
                <th>Total Leaves Taken</th>
                <th>Actions</th>
               </tr>
            </thead>
            <tbody>
              {deletedRows.map((r) => (
                <tr key={r.username} className="border-b">
                  <td className="py-2">
                    <p className="font-semibold">{r.full_name}</p>
                    <p className="text-slate-500">{r.email}</p>
                   </td>
                  <td>
                    <p>{r.deleted_by_name || r.deleted_by}</p>
                    <p className="text-xs text-slate-500">{new Date(r.deleted_at).toLocaleString()}</p>
                   </td>
                  <td>{new Date(r.deleted_at).toLocaleDateString()}</td>
                  <td>{r.restored_at ? new Date(r.restored_at).toLocaleDateString() : "-"}</td>
                  <td>{r.total_leaves_taken} leaves ({r.total_days_consumed} days)</td>
                  <td>
                    <button onClick={() => restoreStaff(r.username, r.full_name)} className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                      Restore
                    </button>
                   </td>
                 </tr>
              ))}
              {deletedRows.length === 0 && <tr><td colSpan={6} className="py-3 text-slate-500">No deleted staff found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl p-5 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedStaff.full_name} - Leave History</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Dates</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Status</th>
                   </tr>
                </thead>
                <tbody>
                  {selectedStaff.leave_history?.map((leave) => (
                    <tr key={leave.id} className="border-b">
                      <td className="py-2">{leave.start_date} - {leave.end_date}</td>
                      <td>{leave.leave_category}</td>
                      <td>{leave.leave_type}</td>
                      <td>{leave.duration_days} days</td>
                      <td>{leave.status}</td>
                     </tr>
                  ))}
                  {(!selectedStaff.leave_history || selectedStaff.leave_history.length === 0) && (
                    <tr><td colSpan={5} className="py-3 text-slate-500">No leave history found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}