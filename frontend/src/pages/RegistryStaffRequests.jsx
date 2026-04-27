import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { CheckCircle, XCircle, Eye } from "lucide-react";

export default function RegistryStaffRequests() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/registry/staff-requests");
      setRows(data || []);
    } catch (err) {
      console.error("Failed to load registry staff requests", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.leave_category, r.leave_type, r.status].join(" ").toLowerCase().includes(s)
    );
  }, [rows, q]);

  const badgeForStatus = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "approved") return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Approved</span>;
    if (s === "rejected") return <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700">Rejected</span>;
    return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Pending</span>;
  };

  const inlineApprove = async (id, fullName) => {
    if (!window.confirm(`Approve and forward ${fullName} to Principal? (This will mark the request as Approved)`)) return;
    const comments = window.prompt("Optional comments to include for Principal (press Cancel to skip):", "") || "";
    try {
      await api.post(`/registry/approve-forward/${id}`, { comments });
      alert("Request approved and forwarded to Principal. (HOD/Registry decision is final unless Principal rejects before start date.)");
      load();
    } catch (err) {
      console.error("Approve failed", err);
      alert(err?.response?.data?.message || "Failed to approve request");
    }
  };

  const inlineReject = async (id, fullName) => {
    const reason = window.prompt(`Provide rejection reason for ${fullName} (required):`);
    if (!reason || !reason.trim()) return alert("Rejection reason is required");
    try {
      await api.post(`/registry/reject-request/${id}`, { rejection_reason: reason });
      alert("Request rejected. It will not be forwarded to Principal.");
      load();
    } catch (err) {
      console.error("Reject failed", err);
      alert(err?.response?.data?.message || "Failed to reject request");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Office Staff Requests</h2>

      <div className="flex items-center gap-3">
        <input
          className="border rounded-xl p-3 w-full bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700"
          placeholder="Search requests..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          onClick={() => load()}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow overflow-auto border border-slate-200 dark:border-gray-700">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-gray-700">
                <th className="py-2 text-slate-700 dark:text-slate-200">Staff</th>
                <th className="text-slate-700 dark:text-slate-200">Details</th>
                <th className="text-slate-700 dark:text-slate-200">Duration</th>
                <th className="text-slate-700 dark:text-slate-200">Reason</th>
                <th className="text-slate-700 dark:text-slate-200">Status</th>
                <th className="text-slate-700 dark:text-slate-200">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-gray-800">
                  <td className="py-2 text-slate-800 dark:text-slate-200">
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-xs text-slate-400">{r.email}</div>
                  </td>
                  <td className="text-slate-700 dark:text-slate-300">{r.leave_category} / {r.leave_type}</td>
                  <td className="text-slate-700 dark:text-slate-300">{r.start_date} - {r.end_date}</td>
                  <td className="text-slate-700 dark:text-slate-300">{r.reason || "-"}</td>
                  <td className="text-slate-700 dark:text-slate-300">{badgeForStatus(r.status)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {/* Approve: only when pending */}
                      {String(r.status || "").toLowerCase() === "pending" && (
                        <button
                          onClick={() => inlineApprove(r.id, r.full_name)}
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Approve & Forward to Principal"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}

                      {/* Quick Reject (works regardless of pending but backend only allows pending) */}
                      {String(r.status || "").toLowerCase() === "pending" && (
                        <button
                          onClick={() => inlineReject(r.id, r.full_name)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      )}

                      <Link className="text-brand-700 dark:text-brand-300 underline flex items-center gap-1" to={`/registry-admin/staff-requests/${r.id}`}>
                        <Eye size={16} /> Review
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 dark:text-slate-400">No requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}