import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { TrendingUp, Calendar, Award, Clock, Heart, Sun, Briefcase } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Filler);

export default function Stats() {
  const [me, setMe] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const results = await Promise.allSettled([
          api.get("/me"),
          api.get("/leave-requests/stats"),
          api.get("/leave-requests/history")
        ]);

        const [meRes, statsRes, histRes] = results;

        if (!mounted) return;

        if (meRes.status === "fulfilled") {
          setMe(meRes.value.data);
        } else {
          // keep me as null - UI will show "Unable to load statistics"
          console.warn("Stats: /me request failed", meRes.reason);
        }

        if (statsRes.status === "fulfilled") {
          // Expecting an array; guard if backend returns other structure
          setMonthly(Array.isArray(statsRes.value.data) ? statsRes.value.data : []);
        } else {
          console.warn("Stats: /leave-requests/stats failed", statsRes.reason);
          setMonthly([]);
        }

        if (histRes.status === "fulfilled") {
          setApproved(Array.isArray(histRes.value.data) ? histRes.value.data : []);
        } else {
          console.warn("Stats: /leave-requests/history failed", histRes.reason);
          setApproved([]);
        }
      } catch (e) {
        console.error("Stats load error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const totalLeaves = useMemo(() => {
    if (!me) return 0;
    return Number(me.medical_leave_left || 0) + Number(me.casual_leave_left || 0) + Number(me.earned_leave_left || 0);
  }, [me]);

  const usedLeaves = useMemo(() => {
    if (!me) return 0;
    return Number(me.medical_leave_used || 0) + Number(me.casual_leave_used || 0) + Number(me.earned_leave_used || 0);
  }, [me]);

  const usagePercentage = useMemo(() => {
    const total = totalLeaves + usedLeaves;
    if (total === 0) return 0;
    return ((usedLeaves / total) * 100).toFixed(1);
  }, [totalLeaves, usedLeaves]);

  const safeLabelForMonth = (m) => {
    if (!m) return "N/A";
    if (m.month) {
      const parts = String(m.month).split("-");
      if (parts.length >= 2) {
        const [year, month] = parts;
        return `${month}/${year}`;
      }
      return String(m.month);
    }
    // fallback if backend returns label or name
    return m.label || m.name || "N/A";
  };

  const barChartData = {
    labels: monthly.map((m) => safeLabelForMonth(m)),
    datasets: [
      {
        label: "Leave Requests",
        data: monthly.map((m) => Number(m.total_requests || 0)),
        backgroundColor: "rgba(43, 83, 230, 0.8)",
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  const doughnutData = {
    labels: ["Used Leaves", "Remaining Leaves"],
    datasets: [
      {
        data: [usedLeaves, totalLeaves],
        backgroundColor: ["#f59e0b", "#10b981"],
        borderWidth: 0,
        cutout: "65%",
      }
    ]
  };

  const categoryData = {
    labels: ["Medical", "Casual", "Earned"],
    datasets: [
      {
        data: [
          Number(me?.medical_leave_left || 0),
          Number(me?.casual_leave_left || 0),
          Number(me?.earned_leave_left || 0)
        ],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        borderWidth: 0,
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Unable to load statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Leave Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive overview of your leave usage</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Medical Leave" value={me.medical_leave_left || 0} total={me.medical_leave_total || 10} icon={Heart} color="blue" />
        <MetricCard title="Casual Leave" value={me.casual_leave_left || 0} total={me.casual_leave_total || 10} icon={Sun} color="emerald" />
        <MetricCard title="Earned Leave" value={me.earned_leave_left || 0} total={me.earned_leave_total || 0} icon={Award} color="amber" />
        <MetricCard title="Total Available" value={totalLeaves} icon={Briefcase} color="purple" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Monthly Leave Trends</h3>
          </div>
          <div className="h-64">
            {monthly.length > 0 ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Usage Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Usage Overview</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-48 h-48">
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: true }} />
            </div>
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{usagePercentage}%</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">of total leaves used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-brand-600" />
          <h3 className="font-semibold text-slate-800 dark:text-white">Leave Type Distribution</h3>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="w-48 h-48">
            <Doughnut data={categoryData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
          <div className="flex-1 space-y-3">
            <CategoryBar label="Medical Leave" value={me.medical_leave_left || 0} total={me.medical_leave_total || 10} color="blue" />
            <CategoryBar label="Casual Leave" value={me.casual_leave_left || 0} total={me.casual_leave_total || 10} color="emerald" />
            <CategoryBar label="Earned Leave" value={me.earned_leave_left || 0} total={me.earned_leave_total || 0} color="amber" />
          </div>
        </div>
      </div>

      {/* Overwork Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Overwork Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{me.overwork_hours || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Overwork Hours</p>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{me.pending_overwork_hours || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pending Hours</p>
          </div>
          <div className="text-center p-4 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{Math.floor((me.pending_overwork_hours || 0) / 5)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Earned Leaves (estimated)</p>
          </div>
        </div>
      </div>

      {/* Approved Leave Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Approved Leave Calendar</h3>
        {approved.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {approved.map((a) => (
              <div key={a.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm">
                <Calendar size={12} />
                {a.start_date} → {a.end_date}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No approved leaves yet.</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, total, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-2xl p-4 border border-slate-200 dark:border-gray-700`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold">{value}{total !== undefined && `/${total}`}</p>
      <p className="text-xs opacity-80 mt-1">{title}</p>
    </div>
  );
}

function CategoryBar({ label, value, total, color }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colors = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500"
  };
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-slate-800 dark:text-white font-medium">{value} / {total}</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2">
        <div className={`${colors[color]} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}