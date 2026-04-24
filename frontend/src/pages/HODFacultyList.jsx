import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function HODFacultyList() {
  const [rows, setRows] = useState([]);
  const [deletedRows, setDeletedRows] = useState([]);
  const [q, setQ] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    api.get("/hod/faculty-list").then((r) => setRows(r.data || []));
    api.get("/hod/deleted-faculty-history").then((r) => setDeletedRows(r.data?.deleted_faculty || []));
  };

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
    try {
      await api.post(`/hod/reset-password/${username}`);
      alert("Password reset successful.");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reset password");
    }
  };

  const softDelete = async (username, fullName) => {
    if (!confirm(`Delete faculty ${fullName}? They can be restored within 30 days.`)) return;
    try {
      await api.delete(`/hod/delete-faculty/${username}`);
      alert(`Faculty ${fullName} soft deleted successfully.`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete faculty");
    }
  };

  const restoreFaculty = async (username, fullName) => {
    if (!confirm(`Restore faculty ${fullName}?`)) return;
    try {
      await api.post(`/hod/restore-faculty/${username}`);
      alert(`Faculty ${fullName} restored successfully.`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to restore faculty");
    }
  };

  const viewHistory = (faculty) => {
    setSelectedFaculty(faculty);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-2xl font-bold">Faculty List</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-2 rounded-xl ${showDeleted ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {showDeleted ? "Showing Deleted" : "Show Deleted Faculty"}
          </button>
          <Link to="/hod-admin/add-faculty" className="bg-brand-600 text-white px-4 py-2 rounded-xl">
            Add New Faculty
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <input
          className="border rounded-xl p-3 w-full"
          placeholder="Search by name, email, designation"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {msg && <p className="text-sm text-indigo-700">{msg}</p>}

      {/* Active Faculty Table */}
      {!showDeleted && (
        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <h3 className="font-bold text-lg mb-3">Active Faculty</h3>
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
                    <button className="px-2 py-1 rounded bg-indigo-100 text-indigo-700" onClick={() => resetPassword(r.username)}>
                      Reset Pwd
                    </button>
                    <button className="px-2 py-1 rounded bg-rose-100 text-rose-700" onClick={() => softDelete(r.username, r.full_name)}>
                      Delete
                    </button>
                    <button className="px-2 py-1 rounded bg-blue-100 text-blue-700" onClick={() => viewHistory(r)}>
                      History
                    </button>
                   </td>
                 </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-3 text-slate-500">No active faculty found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Deleted Faculty Table */}
      {showDeleted && (
        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <h3 className="font-bold text-lg mb-3">Deleted Faculty (Restorable within 30 days)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Faculty Details</th>
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
                    <p className="text-slate-500">{r.designation || "Faculty"}</p>
                   </td>
                  <td>
                    <p>{r.deleted_by_name || r.deleted_by}</p>
                    <p className="text-xs text-slate-500">{new Date(r.deleted_at).toLocaleString()}</p>
                   </td>
                  <td>{new Date(r.deleted_at).toLocaleDateString()}</td>
                  <td>{r.restored_at ? new Date(r.restored_at).toLocaleDateString() : "-"}</td>
                  <td>{r.total_leaves_taken} leaves ({r.total_days_consumed} days)</td>
                  <td>
                    <button className="px-2 py-1 rounded bg-emerald-100 text-emerald-700" onClick={() => restoreFaculty(r.username, r.full_name)}>
                      Restore
                    </button>
                   </td>
                 </tr>
              ))}
              {deletedRows.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-slate-500">No deleted faculty found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl p-5 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedFaculty.full_name} - Leave History</h3>
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
                    <th>Approved By</th>
                   </tr>
                </thead>
                <tbody>
                  {selectedFaculty.leave_history?.map((leave) => (
                    <tr key={leave.id} className="border-b">
                      <td className="py-2">{leave.start_date} - {leave.end_date}</td>
                      <td>{leave.leave_category}</td>
                      <td>{leave.leave_type}</td>
                      <td>{leave.duration_days} days</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          leave.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                          leave.status === "Rejected" ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td>{leave.final_approver || leave.hod_approved_by || "-"}</td>
                     </tr>
                  ))}
                  {(!selectedFaculty.leave_history || selectedFaculty.leave_history.length === 0) && (
                    <tr><td colSpan={6} className="py-3 text-slate-500">No leave history found.</td></tr>
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