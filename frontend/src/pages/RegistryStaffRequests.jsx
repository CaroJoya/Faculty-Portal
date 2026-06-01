import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { CheckCircle, XCircle, Eye } from "lucide-react";

export default function RegistryStaffRequests() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, cancelled: 0 });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/registry/staff-requests");
      const normalized = (data || []).map((r) => ({
        ...r,
        statusLower: String(r.status || "").toLowerCase(),
        isCancelled: !!r.cancelled_at,
        displayStatus: r.cancelled_at ? "Cancelled" : r.status
      }));
      setRows(normalized);
      
      // Calculate stats
      const pending = normalized.filter(r => !r.isCancelled && r.statusLower === "pending").length;
      const approved = normalized.filter(r => !r.isCancelled && r.statusLower === "approved").length;
      const rejected = normalized.filter(r => !r.isCancelled && r.statusLower === "rejected").length;
      const cancelled = normalized.filter(r => r.isCancelled).length;
      setStats({ pending, approved, rejected, cancelled });
    } catch (err) {
      console.error("Failed to load registry staff requests", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let filteredRows = [...rows];
    
    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "cancelled") {
        filteredRows = filteredRows.filter(r => r.isCancelled);
      } else {
        filteredRows = filteredRows.filter(r => !r.isCancelled && r.statusLower === statusFilter);
      }
    }
    
    // Apply search filter
    const s = q.trim().toLowerCase();
    if (s) {
      filteredRows = filteredRows.filter((r) =>
        [r.full_name, r.email, r.leave_category, r.leave_type, r.status].join(" ").toLowerCase().includes(s)
      );
    }
    
    // Sort: cancelled requests at the bottom
    filteredRows.sort((a, b) => {
      if (a.isCancelled && !b.isCancelled) return 1;
      if (!a.isCancelled && b.isCancelled) return -1;
      return 0;
    });
    
    return filteredRows;
  }, [rows, q, statusFilter]);

  const badgeForStatus = (req) => {
    if (req.isCancelled) {
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">Cancelled</span>;
    }
    const s = String(req.status || "").toLowerCase();
    if (s === "approved") return <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Approved</span>;
    if (s === "rejected") return <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700">Rejected</span>;
    return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Pending</span>;
  };

  const inlineApprove = async (id, fullName, isCancelled) => {
    if (isCancelled) {
      alert("Cannot approve a cancelled request");
      return;
    }
    if (!window.confirm(`Approve and forward ${fullName} to Principal? (This will mark the request as Approved)`)) return;
    const comments = window.prompt("Optional comments to include for Principal (press Cancel to skip):", "") || "";
    try {
      await api.post(`/registry/approve-forward/${id}`, { comments });
      alert("Request approved and forwarded to Principal. (Registry decision is final unless Principal rejects before start date.)");
      load();
    } catch (err) {
      console.error("Approve failed", err);
      alert(err?.response?.data?.message || "Failed to approve request");
    }
  };

  const inlineReject = async (id, fullName, isCancelled) => {
    if (isCancelled) {
      alert("Cannot reject a cancelled request");
      return;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Office Staff Requests</h2>
        <div className="flex gap-2">
          <button
            onClick={() => load()}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Pending" count={stats.pending} color="amber" />
        <StatBox label="Approved" count={stats.approved} color="emerald" />
        <StatBox label="Rejected" count={stats.rejected} color="rose" />
        <StatBox label="Cancelled" count={stats.cancelled} color="gray" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="border rounded-xl p-3 flex-1 bg-white dark:bg-gray-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-400 outline-none"
          placeholder="Search requests by name, email, or leave type..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-brand-400 outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {(statusFilter !== "all" || q) && (
          <button
            onClick={() => {
              setQ("");
              setStatusFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
          >
            Clear
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-auto border border-slate-200 dark:border-gray-700">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
                <th className="py-3 px-4 text-slate-700 dark:text-slate-200">Staff</th>
                <th className="py-3 px-4 text-slate-700 dark:text-slate-200">Details</th>
                <th className="py-3 px-4 text-slate-700 dark:text-slate-200">Duration</th>
                <th className="py-3 px-4 text-slate-700 dark:text-slate-200">Reason</th>
                <th className="py-3 px-4 text-slate-700 dark:text-slate-200">Status</th>
                <th className="py-3 px-4 text-slate-700 dark:text-slate-200">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={`border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-900/30 transition-colors ${r.isCancelled ? "opacity-70 bg-gray-50 dark:bg-gray-900/20" : ""}`}>
                  <td className="py-3 px-4">
                    <div className={`font-medium ${r.isCancelled ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-800 dark:text-slate-200"}`}>
                      {r.full_name}
                    </div>
                    <div className="text-xs text-slate-400">{r.email}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{r.leave_category} / {r.leave_type}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{r.start_date} - {r.end_date} ({r.duration_days || 1}d)</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">{r.reason || "-"}</td>
                  <td className="py-3 px-4">{badgeForStatus(r)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {!r.isCancelled && r.statusLower === "pending" && (
                        <>
                          <button
                            onClick={() => inlineApprove(r.id, r.full_name, r.isCancelled)}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Approve & Forward to Principal"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => inlineReject(r.id, r.full_name, r.isCancelled)}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <Link 
                        className="text-brand-700 dark:text-brand-300 underline flex items-center gap-1 text-sm" 
                        to={`/registry-admin/staff-requests/${r.id}`}
                      >
                        <Eye size={16} /> Review
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, count, color }) {
  const colors = {
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400",
    gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-2xl p-4 text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}