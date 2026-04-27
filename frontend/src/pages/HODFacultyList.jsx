import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  Building2,
  MoreVertical,
  Trash2,
  Download,
  Filter,
  RotateCcw,
  History
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HODFacultyList() {
  const token = localStorage.getItem("token");
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [deletedFaculty, setDeletedFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [historyModalFaculty, setHistoryModalFaculty] = useState(null);

  useEffect(() => {
    loadFaculty();
  }, []);

  useEffect(() => {
    filterFaculty();
  }, [searchTerm, departmentFilter, faculty]);

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const [activeRes, deletedRes] = await Promise.all([
        axios.get(`${API}/hod/faculty-list`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/hod/deleted-faculty-history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const activeRows = activeRes.data || [];
      setFaculty(activeRows);
      setDeletedFaculty(deletedRes.data?.deleted_faculty || []);
      
      const uniqueDepts = [...new Set(activeRows.map((f) => f.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (err) {
      console.error("Failed to load faculty list", err);
      alert(err?.response?.data?.message || "Failed to load faculty list");
    } finally {
      setLoading(false);
    }
  };

  const filterFaculty = () => {
    let filtered = [...faculty];
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter((f) => f.department === departmentFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((f) => 
        f.full_name?.toLowerCase().includes(term) ||
        f.username?.toLowerCase().includes(term) ||
        f.email?.toLowerCase().includes(term) ||
        f.department?.toLowerCase().includes(term)
      );
    }
    
    setFilteredFaculty(filtered);
  };

  const deleteFaculty = async (username) => {
    try {
      await axios.delete(`${API}/hod/delete-faculty/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Faculty soft deleted successfully");
      loadFaculty();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete faculty", err);
      alert(err?.response?.data?.message || "Failed to delete faculty");
    }
  };

  const restoreFaculty = async (username, fullName) => {
    if (!window.confirm(`Restore faculty ${fullName}?`)) return;
    try {
      await axios.post(
        `${API}/hod/restore-faculty/${username}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Faculty ${fullName} restored successfully`);
      loadFaculty();
    } catch (err) {
      console.error("Failed to restore faculty", err);
      alert(err?.response?.data?.message || "Failed to restore faculty");
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Username", "Email", "Phone", "Department", "Designation", "Medical Leave", "Casual Leave", "Earned Leave"];
    const rows = filteredFaculty.map((f) => [
      f.full_name,
      f.username,
      f.email,
      f.phone_number || "",
      f.department || "",
      f.designation || "Faculty",
      f.medical_leave_left || 0,
      f.casual_leave_left || 0,
      f.earned_leave_left || 0
    ]);
    
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faculty_list_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  const activeCount = faculty.length;
  const deletedCount = deletedFaculty.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Faculty List</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage faculty members in your department</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowDeleted((p) => !p)}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
              showDeleted
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-300"
            }`}
          >
            <History size={18} />
            {showDeleted ? "Showing Deleted Faculty" : "Show Deleted Faculty"}
          </button>

          {!showDeleted && (
            <>
              <Link
                to="/hod-admin/add-faculty"
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
              >
                <User size={18} />
                Add Faculty
              </Link>
              <button
                onClick={exportToCSV}
                className="bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
              >
                <Download size={18} />
                Export
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox label="Total Faculty" value={activeCount} color="blue" />
        <StatBox label="Departments" value={departments.length} color="purple" />
        <StatBox label="Active" value={activeCount} color="emerald" />
        <StatBox label="Deleted" value={deletedCount} color="amber" />
      </div>

      {!showDeleted && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none appearance-none"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {!showDeleted && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFaculty.length > 0 ? (
            filteredFaculty.map((fac) => (
              <FacultyCard 
                key={fac.username} 
                faculty={fac} 
                onDelete={() => setShowDeleteConfirm(fac)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500">
              No faculty members found
            </div>
          )}
        </div>
      )}

      {showDeleted && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow overflow-auto border border-slate-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-white">
            Deleted Faculty (Restorable within 30 days)
          </h3>
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300">
                <th className="py-2">Faculty</th>
                <th>Department</th>
                <th>Deleted By</th>
                <th>Deleted At</th>
                <th>Leave Summary</th>
                <th>History</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deletedFaculty.map((f) => (
                <tr key={f.username} className="border-b border-slate-100 dark:border-gray-700">
                  <td className="py-2">
                    <p className="font-semibold text-slate-800 dark:text-white">{f.full_name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">@{f.username}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{f.email}</p>
                  </td>
                  <td className="text-slate-700 dark:text-slate-300">{f.department || "-"}</td>
                  <td className="text-slate-700 dark:text-slate-300">{f.deleted_by_name || f.deleted_by || "-"}</td>
                  <td className="text-slate-700 dark:text-slate-300">
                    {f.deleted_at ? new Date(f.deleted_at).toLocaleString() : "-"}
                  </td>
                  <td className="text-slate-700 dark:text-slate-300">
                    {f.total_leaves_taken || 0} leaves ({f.total_days_consumed || 0} days)
                  </td>
                  <td>
                    <button
                      onClick={() => setHistoryModalFaculty(f)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    >
                      View
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => restoreFaculty(f.username, f.full_name)}
                      className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition inline-flex items-center gap-1"
                    >
                      <RotateCcw size={14} />
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
              {deletedFaculty.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-3 text-slate-500 dark:text-slate-400">
                    No deleted faculty found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Confirm Delete</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Delete <span className="font-semibold">{showDeleteConfirm.full_name}</span>?  
              This is a soft delete and can be restored within 30 days.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteFaculty(showDeleteConfirm.username)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-medium transition-all"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-medium transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModalFaculty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl p-5 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {historyModalFaculty.full_name} - Leave History
              </h3>
              <button
                onClick={() => setHistoryModalFaculty(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200 dark:border-gray-700">
                    <th className="py-2">Dates</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModalFaculty.leave_history?.map((leave) => (
                    <tr key={leave.id} className="border-b border-slate-100 dark:border-gray-700">
                      <td className="py-2">{leave.start_date} - {leave.end_date}</td>
                      <td>{leave.leave_category || "-"}</td>
                      <td>{leave.leave_type || "-"}</td>
                      <td>{leave.duration_days || 0} days</td>
                      <td>{leave.status || "-"}</td>
                    </tr>
                  ))}
                  {(!historyModalFaculty.leave_history || historyModalFaculty.leave_history.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-3 text-slate-500 dark:text-slate-400">
                        No leave history found.
                      </td>
                    </tr>
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

function StatBox({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-2xl p-4 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}

function FacultyCard({ faculty, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">{faculty.full_name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{faculty.username}</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreVertical size={16} className="text-slate-500" />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => {
                    setShowActions(false);
                    onDelete();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 w-full"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail size={14} className="text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">{faculty.email}</span>
          </div>
          {faculty.phone_number && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">{faculty.phone_number}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Building2 size={14} className="text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">{faculty.department || "No department"}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Medical</p>
              <p className="font-semibold text-slate-800 dark:text-white">{faculty.medical_leave_left || 0}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Casual</p>
              <p className="font-semibold text-slate-800 dark:text-white">{faculty.casual_leave_left || 0}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Earned</p>
              <p className="font-semibold text-slate-800 dark:text-white">{faculty.earned_leave_left || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Link
            to={`/hod-admin/faculty-requests?faculty=${faculty.username}`}
            className="block text-center text-sm text-brand-600 hover:text-brand-700 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all"
          >
            View Leave History
          </Link>
        </div>
      </div>
    </div>
  );
}