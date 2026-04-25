// frontend/src/pages/HeadClerkDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Users,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sun,
  Snowflake,
  Upload,
  BarChart3,
  Settings,
  Shield
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HeadClerkDashboard() {
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    total_faculty: 0,
    present_today: 0,
    absent_today: 0,
    on_leave_today: 0,
    pending_vacation_calculations: 0
  });
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userRes = await axios.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);

      // Get today's attendance stats
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const todayStr = today.toISOString().slice(0, 10);
      
      const calendarRes = await axios.get(`${API}/headclerk/attendance/calendar`, {
        params: { month, year },
        headers: { Authorization: `Bearer ${token}` }
      });

      const faculty = calendarRes.data.faculty || [];
      const attendance = calendarRes.data.attendance || [];
      const leaveRecords = calendarRes.data.leaveRecords || [];

      const todayAttendance = attendance.filter(a => a.date === todayStr);
      const presentToday = todayAttendance.filter(a => a.status === "Present").length;
      const absentToday = todayAttendance.filter(a => a.status === "Absent").length;
      
      // Check who is on leave today
      const onLeaveToday = leaveRecords.filter(lr => {
        const start = new Date(lr.start_date);
        const end = new Date(lr.end_date);
        return today >= start && today <= end;
      }).length;

      setStats({
        total_faculty: faculty.length,
        present_today: presentToday,
        absent_today: absentToday,
        on_leave_today: onLeaveToday,
        pending_vacation_calculations: 0
      });
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = stats.total_faculty > 0 
    ? ((stats.present_today / stats.total_faculty) * 100).toFixed(1)
    : 0;

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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={24} />
                <h1 className="text-2xl md:text-3xl font-bold">Head Clerk Dashboard</h1>
              </div>
              <p className="text-indigo-100">
                Welcome back, {user?.full_name || "Head Clerk"}!
              </p>
              <p className="text-indigo-100 text-sm mt-1">
                {today.toLocaleDateString("en-US", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Link 
                to="/headclerk/attendance/calendar" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-sm"
              >
                <Calendar size={16} />
                Attendance Calendar
              </Link>
              <Link 
                to="/headclerk/vacation/summer-winter" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-sm"
              >
                <Sun size={16} />
                Vacation Setup
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Total Faculty" 
          value={stats.total_faculty} 
          icon={Users} 
          color="blue"
        />
        <StatCard 
          title="Present Today" 
          value={stats.present_today} 
          icon={CheckCircle} 
          color="emerald"
        />
        <StatCard 
          title="Absent Today" 
          value={stats.absent_today} 
          icon={XCircle} 
          color="rose"
        />
        <StatCard 
          title="On Leave Today" 
          value={stats.on_leave_today} 
          icon={Clock} 
          color="amber"
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${attendanceRate}%`} 
          icon={TrendingUp} 
          color="purple"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          to="/headclerk/attendance/calendar"
          title="Attendance Calendar"
          description="View and mark daily attendance"
          icon={Calendar}
          color="blue"
        />
        <QuickActionCard
          to="/headclerk/attendance/upload"
          title="Upload Attendance"
          description="Bulk upload attendance from Excel/CSV"
          icon={Upload}
          color="green"
        />
        <QuickActionCard
          to="/headclerk/vacation/manage"
          title="Vacation Management"
          description="Manage 7-day vacation periods"
          icon={Sun}
          color="orange"
        />
        <QuickActionCard
          to="/headclerk/vacation/summer-winter"
          title="Summer/Winter Setup"
          description="Configure 40-day vacation periods"
          icon={Snowflake}
          color="cyan"
        />
      </div>

      {/* Recent Activity and Pending Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Attendance Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-brand-600" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Today's Attendance Overview</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="10"
                    strokeDasharray={`${attendanceRate * 2.827} 283`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-1000"
                  />
                  <text x="50" y="55" textAnchor="middle" className="text-2xl font-bold fill-slate-800 dark:fill-white">
                    {attendanceRate}%
                  </text>
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.present_today}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.absent_today}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Absent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.on_leave_today}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">On Leave</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats & Info */}
        <div className="space-y-6">
          {/* System Info */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
            <h3 className="font-semibold mb-3">📋 Quick Tips</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} />
                Mark attendance daily before 10 AM
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} />
                Set vacation periods before they start
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} />
                Run vacation calculations after each period ends
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} />
                Upload monthly attendance for record keeping
              </li>
            </ul>
          </div>

          {/* Pending Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">📌 Pending Actions</h3>
            <div className="space-y-3">
              <Link 
                to="/headclerk/attendance/calendar"
                className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">Mark today's attendance</span>
                </div>
                <span className="text-xs text-amber-600">Pending</span>
              </Link>
              <Link 
                to="/headclerk/vacation/summer-winter"
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sun size={16} className="text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-400">Configure Summer/Winter vacations</span>
                </div>
                <span className="text-xs text-blue-600">Setup</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Updates / News */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-brand-600" />
          <h3 className="font-semibold text-slate-800 dark:text-white">System Updates</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
            <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">Vacation calculation now auto-converts remaining days to earned leaves</p>
              <p className="text-xs text-slate-400 mt-1">Updated: December 2024</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300">Bulk attendance upload now supports Excel and CSV formats</p>
              <p className="text-xs text-slate-400 mt-1">Updated: November 2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-2xl p-4 border border-slate-200 dark:border-gray-700`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80 mt-1">{title}</p>
    </div>
  );
}

function QuickActionCard({ to, title, description, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50",
    green: "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
    orange: "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50",
    cyan: "bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50"
  };
  
  return (
    <Link
      to={to}
      className={`${colors[color]} rounded-xl p-4 border border-slate-200 dark:border-gray-700 transition-all hover:shadow-md`}
    >
      <Icon size={24} className="text-brand-600 mb-2" />
      <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </Link>
  );
}