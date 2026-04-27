import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Search, 
  CheckCircle, 
  XCircle,
  Eye,
  User,
  Calendar,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PrincipalAllPending() {
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [comments, setComments] = useState("");
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, roleFilter, departmentFilter, requests]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/principal/all-pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data || res.data || [];
      setRequests(data);
      
      // Extract unique departments
      const uniqueDepts = [...new Set(data.map(r => r.department).filter(Boolean))];
      setDepartments(uniqueDepts);
      
      // Calculate stats
      const roleStats = {};
      data.forEach(r => {
        roleStats[r.role] = (roleStats[r.role] || 0) + 1;
      });
      setStats(roleStats);
    } catch (err) {
      console.error("Failed to load requests", err);
      alert(err?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];
    
    if (roleFilter !== "all") {
      filtered = filtered.filter(r => r.role === roleFilter);
    }
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter(r => r.department === departmentFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.full_name?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.department?.toLowerCase().includes(term) ||
        r.role?.toLowerCase().includes(term)
      );
    }
    
    setFilteredRequests(filtered);
    setCurrentPage(1);
  };

  const approveRequest = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const isHod = selectedRequest.role === "hod";
      const isRegistry = selectedRequest.role === "registry";
      const isFinal = ["faculty", "officestaff"].includes(selectedRequest.role);
      
      if (isHod) {
        await axios.post(`${API}/principal/approve-hod/${selectedRequest.id}`, 
          { admin_comments: comments },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (isRegistry || isFinal) {
        await axios.post(`${API}/principal/final-approve/${selectedRequest.id}`, 
          { admin_comments: comments },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      alert("Request approved successfully!");
      setSelectedRequest(null);
      setActionType(null);
      setComments("");
      loadRequests();
    } catch (err) {
      console.error("Approve failed", err);
      alert(err?.response?.data?.message || "Failed to approve request");
    } finally {
      setProcessing(false);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;
    
    if (!comments.trim()) {
      alert("Rejection reason is required");
      return;
    }
    
    setProcessing(true);
    try {
      const isHod = selectedRequest.role === "hod";
      const isRegistry = selectedRequest.role === "registry";
      const isFinal = ["faculty", "officestaff"].includes(selectedRequest.role);
      
      if (isHod) {
        await axios.post(`${API}/principal/reject-hod/${selectedRequest.id}`, 
          { admin_comments: comments },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (isRegistry || isFinal) {
        await axios.post(`${API}/principal/final-reject/${selectedRequest.id}`, 
          { admin_comments: comments },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      alert("Request rejected successfully!");
      setSelectedRequest(null);
      setActionType(null);
      setComments("");
      loadRequests();
    } catch (err) {
      console.error("Reject failed", err);
      alert(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };

  // Inline reject (quick action directly from the row)
  const inlineReject = async (req) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (!req.start_date) {
        return alert("Cannot reject: request has no start date");
      }
      // Optional client-side check — backend enforces final rule
      if (new Date(req.start_date) <= new Date(today)) {
        return alert("Cannot reject: start date has already passed or is today");
      }

      const reason = window.prompt(`Provide rejection reason for ${req.full_name}:`);
      if (!reason || !reason.trim()) return alert("Rejection reason is required");

      setProcessing(true);
      // call final-reject for all roles (principal handles mapping)
      await axios.post(`${API}/principal/final-reject/${req.id}`, 
        { admin_comments: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Request rejected successfully");
      loadRequests();
    } catch (err) {
      console.error("Inline reject error", err);
      alert(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Employee", "Department", "Role", "Leave Type", "Start Date", "End Date", "Days", "Reason"];
    const rows = filteredRequests.map(r => [
      r.full_name,
      r.department || "-",
      r.role,
      r.leave_category,
      r.start_date,
      r.end_date,
      r.duration_days || "-",
      r.reason?.replace(/,/g, " ") || "-"
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending_requests_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">All Pending Requests</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review and process leave requests from all departments</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredRequests.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all disabled:opacity-50"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge label="HOD" count={stats.hod || 0} color="purple" />
        <StatBadge label="Faculty" count={stats.faculty || 0} color="blue" />
        <StatBadge label="Registry" count={stats.registry || 0} color="emerald" />
        <StatBadge label="Office Staff" count={stats.officestaff || 0} color="amber" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="hod">HOD</option>
            <option value="faculty">Faculty</option>
            <option value="registry">Registry</option>
            <option value="officestaff">Office Staff</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          {(roleFilter !== "all" || departmentFilter !== "all" || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setDepartmentFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50 border-b border-slate-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Department</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Leave Period</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Days</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Approved By</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {currentItems.length > 0 ? (
                currentItems.map((req) => {
                  // determine approver label
                  let approverLabel = "-";
                  if (req.final_approver) approverLabel = req.final_approver;
                  else if (req.hod_approved) approverLabel = req.hod_approved_by ? `HOD/Registry (${req.hod_approved_by})` : "HOD/Registry";
                  
                  const highlighted = Boolean(req.hod_approved || (req.final_approver && (req.final_approver === "HOD" || req.final_approver === "Registry")));

                  return (
                    <tr key={req.id} className={`hover:bg-slate-50 dark:hover:bg-gray-900/30 transition-colors ${highlighted ? "bg-slate-50 dark:bg-gray-900/20" : ""}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{req.full_name}</p>
                          <p className="text-xs text-slate-400">{req.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{req.department || "-"}</td>
                      <td className="px-6 py-4">
                        <RoleBadge role={req.role} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {req.start_date} → {req.end_date}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          req.leave_category === "medical" ? "bg-blue-100 text-blue-700" :
                          req.leave_category === "casual" ? "bg-emerald-100 text-emerald-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {req.leave_category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                        {req.duration_days || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{approverLabel}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Existing modal-based actions */}
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType("approve");
                              setComments("");
                            }}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>

                          {/* Quick inline reject */}
                          <button
                            onClick={() => inlineReject(req)}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Quick Reject"
                          >
                            <XCircle size={18} />
                          </button>

                          {/* View details (modal) */}
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType("view");
                            }}
                            className="p-2 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle size={48} className="text-emerald-500" />
                      <p>No pending requests found!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} requests
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 rounded-lg bg-brand-600 text-white text-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 shadow-xl">
            <div className="p-5 border-b border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {actionType === "approve" && <CheckCircle size={24} className="text-emerald-600" />}
                {actionType === "reject" && <XCircle size={24} className="text-rose-600" />}
                {actionType === "view" && <FileText size={24} className="text-brand-600" />}
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {actionType === "approve" ? "Approve Request" : 
                   actionType === "reject" ? "Reject Request" : 
                   "Request Details"}
                </h3>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Request Details */}
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Employee:</span> {selectedRequest.full_name}</p>
                <p><span className="font-medium">Department:</span> {selectedRequest.department}</p>
                <p><span className="font-medium">Role:</span> {selectedRequest.role}</p>
                <p><span className="font-medium">Period:</span> {selectedRequest.start_date} → {selectedRequest.end_date}</p>
                <p><span className="font-medium">Leave Type:</span> {selectedRequest.leave_category} ({selectedRequest.leave_type})</p>
                <p><span className="font-medium">Reason:</span> {selectedRequest.reason || "-"}</p>
              </div>
              
              {/* Comments for approve/reject */}
              {(actionType === "approve" || actionType === "reject") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {actionType === "approve" ? "Comments (Optional)" : "Rejection Reason *"}
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                    placeholder={actionType === "approve" ? "Add any remarks..." : "Please provide reason for rejection..."}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setComments("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              {actionType === "approve" && (
                <button
                  onClick={approveRequest}
                  disabled={processing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Approve"}
                </button>
              )}
              {actionType === "reject" && (
                <button
                  onClick={rejectRequest}
                  disabled={processing}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Reject"}
                </button>
              )}
              {actionType === "view" && (
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionType(null);
                  }}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl font-medium transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, count, color }) {
  const colors = {
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-xl p-3 text-center`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    hod: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    faculty: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    registry: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    officestaff: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role] || "bg-gray-100 text-gray-700"}`}>
      {role === "officestaff" ? "Office Staff" : role?.charAt(0).toUpperCase() + role?.slice(1)}
    </span>
  );
}