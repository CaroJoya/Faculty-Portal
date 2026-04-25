import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Calendar, Filter, Eye, FileText, TrendingUp, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function History() {
  const token = localStorage.getItem("token");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/leave-requests/history`, { 
        params: { from, to },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRows(data || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const applyFilters = () => {
    load();
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setTimeout(() => load(), 0);
  };

  const summary = useMemo(() => {
    let totalDays = 0, med = 0, cas = 0, earned = 0;
    for (const r of rows) {
      const days = r.duration_days || 0;
      totalDays += days;
      if (r.leave_category === "medical") med += days;
      if (r.leave_category === "casual") cas += days;
      if (r.leave_category === "earned") earned += days;
    }
    return { 
      totalLeaves: rows.length, 
      totalDays: totalDays.toFixed(1), 
      medical: med.toFixed(1), 
      casual: cas.toFixed(1),
      earned: earned.toFixed(1)
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading leave history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Leave History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View all your approved leave records</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Leaves" value={summary.totalLeaves} icon={FileText} color="blue" />
        <StatCard title="Total Days" value={summary.totalDays} icon={Calendar} color="indigo" />
        <StatCard title="Medical Days" value={summary.medical} icon={TrendingUp} color="rose" />
        <StatCard title="Casual Days" value={summary.casual} icon={TrendingUp} color="emerald" />
        <StatCard title="Earned Days" value={summary.earned} icon={TrendingUp} color="amber" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-500" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Filter by Date Range</h3>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">From Date</label>
            <input 
              type="date" 
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">To Date</label>
            <input 
              type="date" 
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={applyFilters} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition-all">
              Apply
            </button>
            <button onClick={clearFilters} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Approved Leave Records</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{rows.length} approved leave request(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50">
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Period</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Category</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Days</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Approved On</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {rows.length > 0 ? (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {r.start_date} → {r.end_date}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex capitalize px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {r.leave_category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                        {r.leave_type?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {r.duration_days || "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {r.approved_at ? new Date(r.approved_at).toLocaleDateString() : "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedLeave(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        <Eye size={14} />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="text-slate-300 dark:text-slate-600" />
                      <p>No approved leave records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLeave(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Leave Details</h3>
              <button onClick={() => setSelectedLeave(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <DetailRow label="Period" value={`${selectedLeave.start_date} → ${selectedLeave.end_date}`} />
              <DetailRow label="Duration" value={`${selectedLeave.duration_days} day(s)`} />
              <DetailRow label="Category" value={selectedLeave.leave_category} />
              <DetailRow label="Type" value={selectedLeave.leave_type} />
              <DetailRow label="Reason" value={selectedLeave.reason} />
              <DetailRow label="Approved At" value={selectedLeave.approved_at ? new Date(selectedLeave.approved_at).toLocaleString() : "-"} />
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-gray-700">
              <button onClick={() => setSelectedLeave(null)} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400",
    rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-2xl p-4 border border-slate-200 dark:border-gray-700`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-80">{title}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
        </div>
        <Icon size={18} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 dark:text-white mt-1 break-words">{value || "-"}</p>
    </div>
  );
}