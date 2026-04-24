import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const [me, setMe] = useState(null);
  const [pending, setPending] = useState(0);
  const [approved, setApproved] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [overworkHistory, setOverworkHistory] = useState([]);
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
      // Get user profile first
      const userRes = await axios.get(`${API}/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const userData = userRes.data;
      setMe(userData);
      
      // Update localStorage user data if needed
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
      
      // Get leave requests for recent activities
      const leaveRes = await axios.get(`${API}/leave-requests`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const leaves = leaveRes.data || [];
      setRecentLeaves(leaves.slice(0, 3));
      
      // Get overwork data
      try {
        const overworkRes = await axios.get(`${API}/overwork/my-history`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (overworkRes.data) {
          const summary = overworkRes.data;
          setOverworkSummary({
            pending_hours: summary.pending_hours || 0,
            converted_hours: 0,
            earned_leaves: userData.earned_leave_left || 0,
            conversion_rate: summary.conversion_hours_per_leave || 5
          });
          setOverworkHistory(summary.history || []);
        }
      } catch (overworkErr) {
        console.log("Overwork data not available:", overworkErr.message);
        // Set default overwork summary
        setOverworkSummary({
          pending_hours: 0,
          converted_hours: 0,
          earned_leaves: userData.earned_leave_left || 0,
          conversion_rate: 5
        });
      }
      
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      setError(err?.response?.data?.message || "Failed to load dashboard data");
      
      // Try to use localStorage as fallback
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
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
        <p className="mt-3 text-slate-500">Loading dashboard...</p>
      </div>
    );
  }
  
  // Show error state
  if (error && !me) {
    return (
      <div className="p-8 text-center">
        <div className="text-rose-600 mb-3">
          <i className="fas fa-exclamation-circle text-3xl"></i>
        </div>
        <p className="text-slate-600">{error}</p>
        <button 
          onClick={loadData} 
          className="mt-4 bg-brand-600 text-white px-4 py-2 rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!me) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No user data available. Please try logging in again.</p>
        <Link to="/login" className="mt-4 inline-block bg-brand-600 text-white px-4 py-2 rounded-xl">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-bold">
              Welcome back, {me.full_name || me.username}!
            </h3>
            <p className="text-blue-100 mt-1">Here's your faculty dashboard with an overview of your leave requests and attendance.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/request-leave" className="inline-flex items-center px-4 py-2 rounded-xl bg-white/90 text-brand-600 font-semibold hover:bg-white transition">
              + New Leave Request
            </Link>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-amber-600">{pending}</div>
          <div className="font-semibold text-slate-700 mt-1">Pending Requests</div>
          <small className="text-slate-400">Awaiting approval</small>
        </div>
        
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{approved}</div>
          <div className="font-semibold text-slate-700 mt-1">Approved Requests</div>
          <small className="text-slate-400">All time</small>
        </div>
        
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-blue-600">{totalLeavesAvailable}</div>
          <div className="font-semibold text-slate-700 mt-1">Total Leaves Available</div>
          <small className="text-slate-400">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600 mr-1">🏥{me.medical_leave_left || 0}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-600 mr-1">🏖️{me.casual_leave_left || 0}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-600">💰{me.earned_leave_left || 0}</span>
          </small>
        </div>
      </div>
      
      {/* Overwork Tracking Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h5 className="text-lg font-bold text-slate-800">
            🎯 Overwork Hours Tracking
          </h5>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Overwork Form */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h6 className="font-semibold text-slate-800 mb-3">Add Overwork Hours</h6>
              <p className="text-sm text-slate-500 mb-3">
                <strong className="text-amber-600">🔥 AUTOMATIC CONVERSION:</strong> When you reach 5+ hours, system automatically converts them to earned leaves!<br />
                💰 <strong>5 hours = 0.5 day</strong> earned leave<br />
                💰 <strong>8 hours = 1 day</strong> earned leave
              </p>
              <form onSubmit={addOverwork} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Enter hours"
                  value={overworkForm.hours}
                  onChange={(e) => setOverworkForm({ ...overworkForm, hours: e.target.value })}
                  required
                />
                <input
                  type="date"
                  className="border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  value={overworkForm.work_date}
                  onChange={(e) => setOverworkForm({ ...overworkForm, work_date: e.target.value })}
                />
                <button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded-xl transition">
                  Add Hours
                </button>
              </form>
            </div>
            
            {/* Overwork Summary Card */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-5 text-white">
              <h6 className="font-semibold mb-3">📊 Overwork Summary</h6>
              <div className="grid grid-cols-3 text-center mb-4">
                <div className="border-r border-white/20">
                  <div className="text-3xl font-bold">{overworkSummary.pending_hours}</div>
                  <small>Pending Hours</small>
                </div>
                <div className="border-r border-white/20">
                  <div className="text-3xl font-bold">{overworkSummary.converted_hours}</div>
                  <small>Converted Hours</small>
                </div>
                <div>
                  <div className="text-3xl font-bold">{overworkSummary.earned_leaves}</div>
                  <small>Earned Leaves</small>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <small className="mt-1 block text-white/80">
                  {needsMoreHours ? (
                    `${(overworkSummary.conversion_rate - overworkSummary.pending_hours).toFixed(1)} more hours needed for conversion`
                  ) : (
                    <>✓ Ready for automatic conversion!</>
                  )}
                </small>
              </div>
              
              {/* Manual Conversion Button */}
              {!needsMoreHours && overworkSummary.pending_hours >= overworkSummary.conversion_rate && (
                <button onClick={manualConvert} disabled={loading} className="mt-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition w-full">
                  Convert Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {msg && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg z-50">
          {msg}
        </div>
      )}
      
      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h5 className="text-lg font-bold text-slate-800 mb-4">🚀 Quick Actions</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link to="/request-leave" className="bg-gradient-to-r from-brand-600 to-brand-700 text-white text-center py-3 rounded-xl font-semibold hover:shadow-md transition">
              Request Leave
            </Link>
            <Link to="/status" className="bg-gradient-to-r from-sky-500 to-sky-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-md transition">
              Check Status
            </Link>
            <Link to="/history" className="bg-gradient-to-r from-slate-500 to-slate-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-md transition">
              View History
            </Link>
            <Link to="/stats" className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-md transition">
              View Analytics
            </Link>
            <Link to="/vacation" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-md transition">
              Vacation
            </Link>
            <Link to="/profile" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-md transition">
              My Profile
            </Link>
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h5 className="text-lg font-bold text-slate-800 mb-4">📋 Recent Activities</h5>
          <div className="space-y-3">
            {recentLeaves.length > 0 ? (
              recentLeaves.map((leave, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border-l-4 border-brand-500 hover:bg-slate-100 transition">
                  <div>
                    <h6 className="font-semibold text-slate-800 text-sm">{leave.reason || leave.leave_category || "Leave Request"}</h6>
                    <small className="text-slate-400 text-xs">
                      {leave.start_date} → {leave.end_date}
                    </small>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    leave.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                    leave.status === "Rejected" ? "bg-rose-100 text-rose-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {leave.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No recent activities</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Vacation Card Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/vacation" className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white text-center hover:shadow-lg transition hover:-translate-y-1">
          <div className="text-3xl mb-3">🏖️</div>
          <div className="font-bold text-lg">Vacation</div>
          <small>Manage Vacation Leaves</small>
        </Link>
      </div>
      
      {/* Detailed Statistics Button */}
      <div className="text-center">
        <Link to="/stats" className="inline-flex items-center bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-md hover:shadow-lg">
          View Detailed Statistics →
        </Link>
      </div>
    </div>
  );
}