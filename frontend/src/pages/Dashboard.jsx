import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Calendar, 
  FileText, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Sun,
  BarChart3,
  User,
  History as HistoryIcon,
  ListChecks,
  Award
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const [me, setMe] = useState(null);
  const [pending, setPending] = useState(0);
  const [approved, setApproved] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [overworkSummary, setOverworkSummary] = useState({
    pending_hours: 0,
    converted_hours: 0,
    earned_leaves: 0,
    conversion_rate: 5
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [overworkForm, setOverworkForm] = useState({ hours: "", work_date: "", reason: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get user profile
      const userRes = await axios.get(`${API}/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const userData = userRes.data;
      setMe(userData);
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser.username !== userData.username) {
        localStorage.setItem("user", JSON.stringify({
          username: userData.username,
          role: userData.role,
          full_name: userData.full_name,
          department: userData.department
        }));
      }
      
      // Get leave status
      const statusRes = await axios.get(`${API}/leave-requests/status`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setPending(statusRes.data.pending || 0);
      setApproved(statusRes.data.approved || 0);
      setRejected(statusRes.data.rejected || 0);
      
      // Get recent leaves
      const leaveRes = await axios.get(`${API}/leave-requests`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const leaves = leaveRes.data || [];
      setRecentLeaves(leaves.slice(0, 5));
      
      // Get overwork data
      try {
        const overworkRes = await axios.get(`${API}/overwork/my-history`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (overworkRes.data) {
          setOverworkSummary({
            pending_hours: overworkRes.data.pending_hours || 0,
            converted_hours: 0,
            earned_leaves: userData.earned_leave_left || 0,
            conversion_rate: overworkRes.data.conversion_hours_per_leave || 5
          });
        }
      } catch (overworkErr) {
        console.log("Overwork data not available");
        setOverworkSummary(prev => ({
          ...prev,
          earned_leaves: userData.earned_leave_left || 0
        }));
      }
      
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError(err?.response?.data?.message || "Failed to load dashboard data");
      
      // Fallback to localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser && storedUser.username) {
        setMe({
          full_name: storedUser.full_name || storedUser.username,
          medical_leave_left: 10,
          casual_leave_left: 10,
          earned_leave_left: 0,
          ...storedUser
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    } else {
      setIsLoading(false);
      setError("Not authenticated");
    }
  }, [token]);

  const addOverwork = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    
    const hours = parseFloat(overworkForm.hours);
    if (isNaN(hours) || hours <= 0) {
      setMsg("Please enter valid hours");
      setLoading(false);
      return;
    }
    
    const fd = new FormData();
    fd.append("hours", hours);
    fd.append("work_date", overworkForm.work_date || new Date().toISOString().slice(0, 10));
    fd.append("reason", overworkForm.reason || "Overwork entry");
    
    try {
      const res = await axios.post(`${API}/overwork/add`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      
      setMsg(res.data.message || "Overwork hours added successfully!");
      setOverworkForm({ hours: "", work_date: "", reason: "" });
      loadData();
      
      if (res.data.auto_conversion?.converted) {
        setMsg(`✅ Auto-converted! ${res.data.auto_conversion.earned_days} earned leave(s) added.`);
      }
      
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to add overwork hours");
    } finally {
      setLoading(false);
    }
  };
  
  const manualConvert = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/overwork/convert`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg(res.data.message || "Conversion completed!");
      loadData();
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Conversion failed");
    } finally {
      setLoading(false);
    }
  };
  
  const totalLeavesAvailable = me ? ((me.medical_leave_left || 0) + (me.casual_leave_left || 0) + (me.earned_leave_left || 0)) : 0;
  const progressPercentage = Math.min(100, (overworkSummary.pending_hours / overworkSummary.conversion_rate) * 100);
  const needsMoreHours = overworkSummary.pending_hours < overworkSummary.conversion_rate;

  if (isLoading) {
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
          <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
        <button 
          onClick={loadData} 
          className="mt-4 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">No user data available. Please try logging in again.</p>
        <Link to="/login" className="mt-4 inline-block bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl transition-all">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {me.full_name || me.username}!
              </h1>
              <p className="text-brand-100 mt-1">Here's your faculty dashboard overview</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link 
                to="/request-leave" 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all font-semibold"
              >
                <FileText size={18} />
                New Leave Request
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Requests"
          value={pending}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Requests"
          value={approved}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Rejected Requests"
          value={rejected}
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Leaves Available"
          value={totalLeavesAvailable}
          icon={Award}
          color="blue"
          subtitle={`M:${me.medical_leave_left || 0} C:${me.casual_leave_left || 0} E:${me.earned_leave_left || 0}`}
        />
      </div>
      
      {/* Overwork Tracking Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity size={18} className="text-brand-600" />
            Overwork Hours Tracking
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track extra working hours and convert them to earned leaves
          </p>
        </div>
        <div className="p-5">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Add Overwork Form */}
            <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-5 border border-slate-200 dark:border-gray-700">
              <h4 className="font-medium text-slate-800 dark:text-white mb-3">Add Overwork Hours</h4>
              <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                <strong>💡 Auto Conversion:</strong> Every 5 hours = 1 earned leave day
              </div>
              <form onSubmit={addOverwork} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    className="flex-1 border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                    placeholder="Enter hours"
                    value={overworkForm.hours}
                    onChange={(e) => setOverworkForm({ ...overworkForm, hours: e.target.value })}
                    required
                  />
                  <input
                    type="date"
                    className="border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                    value={overworkForm.work_date}
                    onChange={(e) => setOverworkForm({ ...overworkForm, work_date: e.target.value })}
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-all">
                  {loading ? "Adding..." : "Add Hours"}
                </button>
              </form>
            </div>
            
            {/* Overwork Summary Card */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white">
              <h4 className="font-semibold mb-3">📊 Overwork Summary</h4>
              <div className="grid grid-cols-3 text-center mb-4">
                <div className="border-r border-white/20">
                  <div className="text-2xl font-bold">{overworkSummary.pending_hours}</div>
                  <small>Pending Hours</small>
                </div>
                <div className="border-r border-white/20">
                  <div className="text-2xl font-bold">{overworkSummary.converted_hours}</div>
                  <small>Converted</small>
                </div>
                <div>
                  <div className="text-2xl font-bold">{overworkSummary.earned_leaves}</div>
                  <small>Earned Leaves</small>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to next leave</span>
                  <span>{progressPercentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
              </div>
              
              {/* Manual Conversion Button */}
              {!needsMoreHours && overworkSummary.pending_hours >= overworkSummary.conversion_rate && (
                <button onClick={manualConvert} disabled={loading} className="mt-2 w-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                  Convert Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Message */}
      {msg && (
        <div className="fixed bottom-4 right-4 bg-slate-800 dark:bg-gray-900 text-white px-4 py-2 rounded-xl shadow-lg z-50">
          {msg}
        </div>
      )}
      
      {/* Quick Actions and Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">🚀 Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/request-leave" label="Request Leave" icon={FileText} color="brand" />
            <QuickAction to="/status" label="Check Status" icon={ListChecks} color="sky" />
            <QuickAction to="/history" label="View History" icon={HistoryIcon} color="slate" />
            <QuickAction to="/stats" label="Analytics" icon={BarChart3} color="emerald" />
            <QuickAction to="/vacation" label="Vacation" icon={Calendar} color="amber" />
            <QuickAction to="/profile" label="Profile" icon={User} color="purple" />
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">📋 Recent Activities</h3>
          <div className="space-y-3">
            {recentLeaves.length > 0 ? (
              recentLeaves.map((leave, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl border-l-4 border-brand-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{leave.reason || leave.leave_category || "Leave Request"}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {leave.start_date} → {leave.end_date}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    leave.status === "Approved" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                    leave.status === "Rejected" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" :
                    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  }`}>
                    {leave.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                No recent activities
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = {
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/50" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/50" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/50" },
    blue: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/50" }
  };
  
  const colorStyle = colors[color] || colors.blue;
  
  return (
    <div className={`${colorStyle.bg} rounded-2xl p-5 border border-slate-200 dark:border-gray-700 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
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
    sky: "bg-sky-500 hover:bg-sky-600",
    slate: "bg-slate-500 hover:bg-slate-600",
    emerald: "bg-emerald-500 hover:bg-emerald-600",
    amber: "bg-amber-500 hover:bg-amber-600",
    purple: "bg-purple-500 hover:bg-purple-600"
  };
  
  return (
    <Link
      to={to}
      className={`${colors[color]} text-white text-center py-3 rounded-xl font-medium transition-all hover:shadow-md flex items-center justify-center gap-2 text-sm`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}