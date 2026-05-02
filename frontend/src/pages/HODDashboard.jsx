// frontend/src/pages/HODDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  UserCheck,
  TrendingUp,
  Calendar,
  ClipboardList,
  Building2,
  UserPlus,
  Eye
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

export default function HODDashboard() {
  const token = localStorage.getItem("token");
  const [me, setMe] = useState(null);
  const [myStatus, setMyStatus] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [admin, setAdmin] = useState({
    total_faculty: 0,
    pending_faculty_leaves: 0,
    approved_faculty_leaves: 0,
    rejected_faculty_leaves: 0,
    medical_count: 0,
    casual_count: 0,
    earned_count: 0,
    department: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          axios.get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/leave-requests/status`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/hod/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const [meRes, statusRes, statsRes] = results;

        if (!mounted) return;

        if (meRes.status === "fulfilled") {
          setMe(meRes.value.data);
        } else {
          console.warn("HODDashboard: /me failed", meRes.reason);
        }

        if (statusRes.status === "fulfilled") {
          setMyStatus(statusRes.value.data || { pending: 0, approved: 0, rejected: 0 });
        } else {
          console.warn("HODDashboard: /leave-requests/status failed", statusRes.reason);
        }

        if (statsRes.status === "fulfilled") {
          setAdmin(statsRes.value.data || {
            total_faculty: 0,
            pending_faculty_leaves: 0,
            approved_faculty_leaves: 0,
            rejected_faculty_leaves: 0,
            medical_count: 0,
            casual_count: 0,
            earned_count: 0,
            department: ""
          });
        } else {
          console.warn("HODDashboard: /hod/dashboard-stats failed", statsRes.reason);
        }
      } catch (err) {
        console.error("HODDashboard load error:", err);
        setError("Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !me) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-700 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Welcome, {me?.full_name || "HOD"}!</h1>
              <p className="text-brand-100 mt-1">
                {admin.department || "Department"} • Head of Department
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Link 
                to="/hod-admin/faculty-requests" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-sm"
              >
                <ClipboardList size={16} />
                Review Requests
              </Link>
              <Link 
                to="/hod-admin/add-faculty" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-sm"
              >
                <UserPlus size={16} />
                Add Faculty
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* As Employee Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
          <UserCheck size={18} className="text-brand-600" />
          As Employee
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCardMini title="My Pending" value={myStatus.pending} color="amber" />
          <StatCardMini title="My Approved" value={myStatus.approved} color="emerald" />
          <StatCardMini title="My Rejected" value={myStatus.rejected} color="rose" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <QuickActionLink to="/hod/request-leave" label="Request My Leave" />
          <QuickActionLink to="/hod/status" label="My Status" />
          <QuickActionLink to="/hod/history" label="My History" />
          <QuickActionLink to="/hod/stats" label="My Stats" />
          <QuickActionLink to="/hod/profile" label="My Profile" />
        </div>
      </div>

      {/* As Admin Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-white flex items-center gap-2">
          <Building2 size={18} className="text-brand-600" />
          As Admin (Faculty Management)
        </h3>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCardMini title="Total Faculty" value={admin.total_faculty} color="blue" />
          <StatCardMini title="Pending Requests" value={admin.pending_faculty_leaves} color="amber" />
          <StatCardMini title="Approved (This Year)" value={admin.approved_faculty_leaves} color="emerald" />
          <StatCardMini title="Rejected (This Year)" value={admin.rejected_faculty_leaves} color="rose" />
        </div>
        
        {/* Pending by Category */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatCardMini title="Medical Pending" value={admin.medical_count} color="blue" />
          <StatCardMini title="Casual Pending" value={admin.casual_count} color="emerald" />
          <StatCardMini title="Earned Pending" value={admin.earned_count} color="amber" />
        </div>
        
        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <AdminActionCard 
            to="/hod-admin/faculty-requests"
            title="Review Faculty Requests"
            description="Approve or reject leave requests"
            icon={ClipboardList}
            color="brand"
          />
          <AdminActionCard 
            to="/hod-admin/faculty-list"
            title="Faculty List"
            description="View and manage faculty members"
            icon={Users}
            color="blue"
          />
          <AdminActionCard 
            to="/hod-admin/add-faculty"
            title="Add Faculty"
            description="Create new faculty account"
            icon={UserPlus}
            color="emerald"
          />
        </div>
      </div>

      {/* Quick Stats & Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-brand-600" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Department Overview</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{admin.total_faculty}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Faculty</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{admin.pending_faculty_leaves}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pending Approvals</p>
              </div>
            </div>
            
            {/* Approval Rate */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Department Approval Rate</span>
                <span className="text-slate-800 dark:text-white font-medium">
                  {admin.total_faculty > 0 
                    ? Math.round((admin.approved_faculty_leaves / (admin.approved_faculty_leaves + admin.rejected_faculty_leaves || 1)) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${admin.total_faculty > 0 
                      ? Math.min(100, (admin.approved_faculty_leaves / (admin.approved_faculty_leaves + admin.rejected_faculty_leaves || 1)) * 100)
                      : 0}%` 
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={18} />
            Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-indigo-100">
            <li className="flex items-center gap-2">
              <CheckCircle size={14} />
              Review faculty leave requests promptly
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} />
              Monitor department leave balances
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} />
              Add new faculty when they join
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} />
              Your own leave goes directly to Principal
            </li>
          </ul>
        </div>
      </div>

      {/* Recent Faculty Requests Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Recent Faculty Requests</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Latest leave requests from your department</p>
          </div>
          <Link to="/hod-admin/faculty-requests" className="text-sm text-brand-600 hover:text-brand-700">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50">
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Faculty</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Period</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Category</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Days</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {admin.recent_requests && admin.recent_requests.length > 0 ? (
                admin.recent_requests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-slate-800 dark:text-white">{req.full_name}</p>
                      <p className="text-xs text-slate-400">{req.department}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        req.leave_category === "medical" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        req.leave_category === "casual" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {req.leave_category}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-white">{req.duration_days || "-"}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === "Approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        req.status === "Rejected" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No leave requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCardMini({ title, value, color }) {
  const colors = {
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-xl p-3 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{title}</p>
    </div>
  );
}

function QuickActionLink({ to, label }) {
  return (
    <Link
      to={to}
      className="rounded-xl p-2.5 text-center border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700"
    >
      {label}
    </Link>
  );
}

function AdminActionCard({ to, title, description, icon: Icon, color }) {
  const colors = {
    brand: "bg-brand-50 dark:bg-brand-950/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 border-brand-200 dark:border-brand-800",
    blue: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800"
  };
  
  return (
    <Link to={to} className={`${colors[color]} rounded-xl p-4 border transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-white/50 dark:bg-black/20">
          <Icon size={20} className={`text-${color === 'brand' ? 'brand' : color}-600`} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
    </Link>
  );
}