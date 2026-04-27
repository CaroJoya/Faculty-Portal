import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Calendar,
  User,
  FileText
} from "lucide-react";
import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HODFacultyRequests() {
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, statusFilter, requests]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/hod/faculty-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
      
      // Calculate stats
      const pending = res.data.filter(r => r.status === "pending").length;
      const approved = res.data.filter(r => r.status === "approved").length;
      const rejected = res.data.filter(r => r.status === "rejected").length;
      setStats({ pending, approved, rejected });
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.faculty_name?.toLowerCase().includes(term) ||
        r.department?.toLowerCase().includes(term) ||
        r.leave_category?.toLowerCase().includes(term)
      );
    }
    
    setFilteredRequests(filtered);
  };

  // Updated to call the new backend endpoints for HOD approval/rejection
  const updateStatus = async (id, status) => {
    try {
      if (status === "approved") {
        // optional comments can be asked here
        const comments = window.prompt("Any remarks (optional):", "") || "";
        await axios.post(`${API}/hod/forward-to-principal/${id}`, 
          { hod_comments: comments },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Request approved successfully");
      } else if (status === "rejected") {
        const reason = window.prompt("Rejection reason (required):", "") || "";
        if (!reason.trim()) {
          return alert("Rejection reason is required");
        }
        await axios.post(`${API}/hod/reject-request/${id}`, 
          { rejection_reason: reason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Request rejected successfully");
      } else {
        return alert("Unknown action");
      }
      loadRequests();
    } catch (err) {
      console.error("Failed to update status", err);
      alert(err?.response?.data?.message || "Failed to update request");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Faculty Leave Requests</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review and manage leave requests from your department</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatSummary label="Pending" count={stats.pending} color="amber" />
        <StatSummary label="Approved" count={stats.approved} color="emerald" />
        <StatSummary label="Rejected" count={stats.rejected} color="rose" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by faculty name, department, or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl capitalize transition-all ${
                  statusFilter === status
                    ? "bg-brand-600 text-white"
                    : "bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-gray-900/50">
            <tr className="text-left">
              <th className="px-6 py-3">Faculty</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Period</th>
              <th className="px-6 py-3">Days</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-slate-50 dark:hover:bg-gray-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800 dark:text-white">{req.full_name}</p>
                    <p className="text-xs text-slate-400">{req.email}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{req.department}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {req.leave_category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                    {req.start_date} → {req.end_date}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{req.days}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/hod-admin/faculty-requests/${req.id}`}
                        className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                      >
                        <Eye size={18} />
                      </Link>
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(req.id, "approved")}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => updateStatus(req.id, "rejected")}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatSummary({ label, count, color }) {
  const colors = {
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-2xl p-4 text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    approved: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}