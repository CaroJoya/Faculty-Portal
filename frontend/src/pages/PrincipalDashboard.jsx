import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Filler
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Building2,
  FileText,
  Eye,
  ClipboardList,
  User
} from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler);

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PrincipalDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("=== PrincipalDashboard Debug ===");
    console.log("Token exists:", !!token);
    console.log("Token value:", token ? token.substring(0, 50) + "..." : "null");
    console.log("User:", user);
    console.log("User role:", user?.role);
    console.log("API URL:", API);
    
    // If not principal, redirect
    if (user?.role !== "principal") {
      console.log("Not principal, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }
    
    // Load data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading principal dashboard data...");
      console.log("Making request to:", `${API}/principal/dashboard-stats`);
      
      const response = await axios.get(`${API}/principal/dashboard-stats`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Dashboard data loaded:", response.data);
      console.log("Response status:", response.status);
      
      // Check if data has the expected structure
      if (!response.data) {
        throw new Error("No data received from server");
      }
      
      setStats(response.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error message:", err.message);
      
      // Set a user-friendly error message
      if (err.response?.status === 401) {
        setError("Authentication failed. Please login again.");
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 403) {
        setError("You don't have permission to access this page.");
      } else if (err.response?.status === 404) {
        setError("API endpoint not found. Please check if the backend is running.");
      } else {
        setError(err?.response?.data?.message || "Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading dashboard data...</p>
        <p className="text-sm text-slate-400 mt-2">Fetching from: {API}/principal/dashboard-stats</p>
      </div>
    );
  }

  // Show error state with retry button
  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Error Loading Dashboard</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">{error || "Failed to load dashboard"}</p>
        <div className="space-x-3">
          <button 
            onClick={loadDashboardData} 
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl transition-all"
          >
            Retry
          </button>
          <Link 
            to="/principal/all-pending" 
            className="inline-block bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 px-6 py-2 rounded-xl hover:bg-slate-200 transition-all"
          >
            View Pending Requests
          </Link>
        </div>
      </div>
    );
  }

  // Prepare chart data with safe defaults
  const departments = stats.departments_with_pending || [];
  const departmentData = {
    labels: departments.length > 0 ? departments : ["No Data"],
    datasets: [{
      data: departments.length > 0 ? departments.map(() => 1) : [1],
      backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899"],
      borderWidth: 0,
    }]
  };

  const roleData = {
    labels: ["HOD", "Faculty", "Registry", "Office Staff"],
    datasets: [{
      data: [
        stats.hod_pending || 0,
        stats.faculty_pending || 0,
        stats.registry_pending || 0,
        stats.office_staff_pending || 0
      ],
      backgroundColor: ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"],
      borderWidth: 0,
    }]
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">Principal Dashboard</h1>
          <p className="text-brand-100 mt-1">
            Welcome back, {user?.full_name || "Principal"}!
          </p>
          <div className="mt-4 flex gap-3">
            <Link 
              to="/principal/all-pending" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-sm"
            >
              <FileText size={16} />
              View All Pending
            </Link>
            <Link 
              to="/principal/hod-pending" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-sm"
            >
              <Users size={16} />
              HOD Requests
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Pending" 
          value={stats.total_pending || 0} 
          icon={Clock} 
          color="amber"
          subtitle="across all departments"
        />
        <StatCard 
          title="HOD Pending" 
          value={stats.hod_pending || 0} 
          icon={Users} 
          color="purple"
        />
        <StatCard 
          title="Faculty Pending" 
          value={stats.faculty_pending || 0} 
          icon={Building2} 
          color="blue"
        />
        <StatCard 
          title="Departments" 
          value={departments.length || 0} 
          icon={Calendar} 
          color="emerald"
          subtitle="with pending requests"
        />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Departments with Pending</h3>
          </div>
          {departments.length > 0 ? (
            <>
              <div className="flex justify-center">
                <div className="w-48 h-48">
                  <Doughnut data={departmentData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {departments.map((dept, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-400">
                    {dept}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500 py-8">No departments with pending requests</p>
          )}
        </div>

        {/* Role Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Pending by Role</h3>
          </div>
          <div className="flex justify-center">
            <div className="w-48 h-48">
              <Doughnut data={roleData} options={{ responsive: true, maintainAspectRatio: true }} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <RoleStat label="HOD" count={stats.hod_pending || 0} color="purple" />
            <RoleStat label="Faculty" count={stats.faculty_pending || 0} color="blue" />
            <RoleStat label="Registry" count={stats.registry_pending || 0} color="emerald" />
            <RoleStat label="Office Staff" count={stats.office_staff_pending || 0} color="amber" />
          </div>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Recent Pending Requests</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Latest leave requests awaiting your action</p>
          </div>
          <Link to="/principal/all-pending" className="text-sm text-brand-600 hover:text-brand-700">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50">
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Department</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Role</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Period</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {stats.recent_requests && stats.recent_requests.length > 0 ? (
                stats.recent_requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-slate-800 dark:text-white">{req.full_name}</p>
                      <p className="text-xs text-slate-400">{req.email}</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{req.department}</td>
                    <td className="p-4">
                      <span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-700">
                        {req.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="p-4 capitalize">
                      {req.leave_category}
                    </td>
                    <td className="p-4">
                      <Link 
                        to={`/principal/all-pending`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-400 hover:bg-brand-100 transition-colors text-sm"
                      >
                        <Eye size={14} />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No pending requests found
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
function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = {
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-2xl p-5 border border-slate-200 dark:border-gray-700`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
          <Icon size={20} className={colors[color].split(" ")[2]} />
        </div>
      </div>
    </div>
  );
}

function RoleStat({ label, count, color }) {
  const colors = {
    purple: "bg-purple-100 dark:bg-purple-900/30",
    blue: "bg-blue-100 dark:bg-blue-900/30",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30",
    amber: "bg-amber-100 dark:bg-amber-900/30"
  };
  
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg ${colors[color]}`}>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <span className="text-lg font-bold text-slate-800 dark:text-white">{count}</span>
    </div>
  );
}