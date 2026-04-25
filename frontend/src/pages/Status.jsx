import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Eye,
  Download,
  Calendar,
  UserCheck,
  AlertCircle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Status() {
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/leave-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];
      setRequests(data);
      setCounts({
        total: data.length,
        approved: data.filter((x) => x.status === "Approved").length,
        rejected: data.filter((x) => x.status === "Rejected").length,
        pending: data.filter((x) => x.status === "Pending").length
      });
    } catch (err) {
      console.error("Failed to load leave requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openLetter = async (id) => {
    try {
      const res = await axios.get(`${API}/leave-letter/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.letter_path) {
        window.open(`${API.replace("/api", "")}${res.data.letter_path}`, "_blank");
      } else {
        alert("Letter not available yet");
      }
    } catch {
      alert("Letter not available");
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      Approved: { icon: CheckCircle, bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Approved" },
      Rejected: { icon: XCircle, bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", label: "Rejected" },
      Pending: { icon: Clock, bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Pending" }
    };
    const c = config[status] || config.Pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon size={12} />
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Leave Status</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track your leave requests and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Requests" 
          value={counts.total} 
          icon={FileText} 
          color="slate"
        />
        <StatCard 
          title="Approved" 
          value={counts.approved} 
          icon={CheckCircle} 
          color="emerald"
        />
        <StatCard 
          title="Rejected" 
          value={counts.rejected} 
          icon={XCircle} 
          color="rose"
        />
        <StatCard 
          title="Pending" 
          value={counts.pending} 
          icon={Clock} 
          color="amber"
        />
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Leave Requests History</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">All your submitted leave requests</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50">
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Dates</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Category</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Duration</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Letter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {requests.length > 0 ? (
                requests.map((r) => (
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
                      <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                        {r.leave_type?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                        {r.leave_category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {r.duration_days || "-"} day(s)
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(r.status)}</td>
                    <td className="p-4">
                      {r.status === "Approved" ? (
                        <button
                          onClick={() => openLetter(r.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors text-sm"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="text-slate-300 dark:text-slate-600" />
                      <p>No leave requests found</p>
                      <button 
                        onClick={() => window.location.href = "/request-leave"}
                        className="mt-2 text-brand-600 dark:text-brand-400 text-sm font-medium hover:underline"
                      >
                        Submit your first leave request →
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Approval Workflow</p>
            <p className="mt-0.5">Your request will be reviewed by your HOD and forwarded to Principal for final approval. Approved requests will have a downloadable approval letter.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    slate: { bg: "bg-slate-50 dark:bg-slate-900/50", text: "text-slate-600 dark:text-slate-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" }
  };
  
  return (
    <div className={`${colors[color].bg} rounded-2xl p-4 border border-slate-200 dark:border-gray-700`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
          <p className={`text-2xl font-bold ${colors[color].text} mt-1`}>{value}</p>
        </div>
        <Icon size={20} className={colors[color].text} />
      </div>
    </div>
  );
}