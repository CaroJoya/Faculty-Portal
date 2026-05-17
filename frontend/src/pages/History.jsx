import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Eye, FileText, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

export default function History() {
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // Use the existing endpoint that works
      const { data } = await axios.get(`${API}/leave-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Show only approved/rejected (history)
      const historyData = (data || []).filter(
        (request) => request.status === "Approved" || request.status === "Rejected"
      );
      
      setRequests(historyData);
    } catch (err) {
      console.error("Failed to load history", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Leave History</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View all your processed leave requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {requests.filter(r => r.status === "Approved").length}
          </p>
          <p className="text-xs text-slate-500">Approved</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {requests.filter(r => r.status === "Rejected").length}
          </p>
          <p className="text-xs text-slate-500">Rejected</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {requests.reduce((sum, r) => sum + (r.duration_days || 0), 0)}
          </p>
          <p className="text-xs text-slate-500">Total Days</p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Your Leave Records</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{requests.length} record(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50">
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm">Period</th>
                <th className="text-left p-4 text-sm">Category</th>
                <th className="text-left p-4 text-sm">Days</th>
                <th className="text-left p-4 text-sm">Status</th>
                <th className="text-left p-4 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {requests.length > 0 ? (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-sm">{r.start_date} → {r.end_date}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30">
                        {r.leave_category}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{r.duration_days || "-"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === "Approved" 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedLeave(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 text-sm"
                      >
                        <Eye size={14} />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No leave history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLeave(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Leave Details</h3>
              <button onClick={() => setSelectedLeave(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p><strong>Period:</strong> {selectedLeave.start_date} → {selectedLeave.end_date}</p>
              <p><strong>Days:</strong> {selectedLeave.duration_days}</p>
              <p><strong>Category:</strong> {selectedLeave.leave_category}</p>
              <p><strong>Type:</strong> {selectedLeave.leave_type}</p>
              <p><strong>Reason:</strong> {selectedLeave.reason}</p>
              <p><strong>Status:</strong> {selectedLeave.status}</p>
              {selectedLeave.hod_comments && <p><strong>HOD Comments:</strong> {selectedLeave.hod_comments}</p>}
              {selectedLeave.admin_comments && <p><strong>Admin Comments:</strong> {selectedLeave.admin_comments}</p>}
            </div>
            <div className="p-5 border-t">
              <button onClick={() => setSelectedLeave(null)} className="w-full bg-brand-600 text-white py-2 rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}