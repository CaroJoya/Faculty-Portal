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
  ClipboardList
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HODDashboard() {
  const token = localStorage.getItem("token");
  const [stats, setStats] = useState({
    totalFaculty: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    department: ""
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get HOD dashboard stats
      const statsRes = await axios.get(`${API}/hod/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);

      // Get recent faculty requests
      const requestsRes = await axios.get(`${API}/hod/faculty-requests?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentRequests(requestsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">HOD Dashboard</h1>
          <p className="text-brand-100 mt-1">
            Manage your department • {stats.department || "Department"}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Faculty"
          value={stats.totalFaculty}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved"
          value={stats.approvedRequests}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Rejected"
          value={stats.rejectedRequests}
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <QuickAction to="/hod-admin/faculty-requests" label="Review Faculty Requests" icon={ClipboardList} color="brand" />
            <QuickAction to="/hod-admin/faculty-list" label="View Faculty List" icon={Users} color="blue" />
            <QuickAction to="/hod-admin/add-faculty" label="Add New Faculty" icon={UserCheck} color="emerald" />
            <QuickAction to="/hod/request-leave" label="My Leave Request" icon={FileText} color="purple" />
          </div>
        </div>

        {/* Recent Requests */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white">Recent Faculty Requests</h3>
            <Link to="/hod-admin/faculty-requests" className="text-sm text-brand-600 hover:text-brand-700">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentRequests.length > 0 ? (
              recentRequests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                No pending requests
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/50" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/50" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/50" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/50" }
  };
  
  const colorStyle = colors[color] || colors.blue;
  
  return (
    <div className={`${colorStyle.bg} rounded-2xl p-5 border border-slate-200 dark:border-gray-700`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`${colorStyle.iconBg} p-3 rounded-xl`}>
          <Icon size={20} className={colorStyle.text} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, label, icon: Icon, color }) {
  const colors = {
    brand: "bg-brand-600 hover:bg-brand-700",
    blue: "bg-blue-500 hover:bg-blue-600",
    emerald: "bg-emerald-500 hover:bg-emerald-600",
    purple: "bg-purple-500 hover:bg-purple-600"
  };
  
  return (
    <Link
      to={to}
      className={`${colors[color]} text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2`}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function RequestCard({ request }) {
  const statusColors = {
    pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    approved: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
  };

  return (
    <Link to={`/hod-admin/faculty-requests/${request.id}`} className="block">
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
        <div className="flex-1">
          <p className="font-medium text-slate-800 dark:text-white">{request.faculty_name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {request.leave_category} • {request.start_date} → {request.end_date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[request.status] || statusColors.pending}`}>
            {request.status}
          </span>
          <span className="text-xs text-slate-400">{request.days} days</span>
        </div>
      </div>
    </Link>
  );
}