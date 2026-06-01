import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Calendar, Sun, Snowflake, Filter, Download, ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

const COLOR_MAP = {
  "Summer Vacation": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  "Winter Vacation": "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
};

const ICON_MAP = {
  "Summer Vacation": "☀️",
  "Winter Vacation": "❄️"
};

export default function HeadClerkVacationCalendar() {
  const token = localStorage.getItem("token");
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [department, setDepartment] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [facultyId, setFacultyId] = useState("");
  const [vacationRecords, setVacationRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFaculty = async () => {
    try {
      const res = await axios.get(`${API}/headclerk/faculty/by-department`, {
        params: { department: department || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setFacultyList(res.data || []);
      if (facultyId && !(res.data || []).find((f) => f.username === facultyId)) setFacultyId("");
    } catch (err) {
      console.error("Failed to load faculty", err);
      setError("Failed to load faculty list");
    }
  };

  const loadVacationCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/headclerk/vacation/calendar`, {
        params: { month, year, department: department || undefined, faculty_id: facultyId || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      // The API returns leaveRecords directly
      const records = res.data || [];
      setVacationRecords(records);
    } catch (err) {
      console.error("Failed to load vacation calendar", err);
      setError(err?.response?.data?.message || "Failed to load vacation calendar");
      setVacationRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, [department]);

  useEffect(() => {
    loadVacationCalendar();
  }, [month, year, department, facultyId]);

  const exportToCSV = () => {
    const headers = ["Faculty", "Department", "Vacation Type", "Start Date", "End Date", "Days"];
    const rows = vacationRecords.map(r => [
      r.full_name || r.faculty_name || "-",
      r.department || "-",
      r.special_leave_type === "Summer Vacation" ? "Summer Vacation" : (r.special_leave_type === "Winter Vacation" ? "Winter Vacation" : r.vacation_type || "-"),
      r.start_date,
      r.end_date,
      r.duration_days || r.days || "-"
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vacation_calendar_${year}_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const prevMonth = () => {
    let newMonth = parseInt(month) - 1;
    let newYear = parseInt(year);
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setMonth(String(newMonth));
    setYear(String(newYear));
  };

  const nextMonth = () => {
    let newMonth = parseInt(month) + 1;
    let newYear = parseInt(year);
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setMonth(String(newMonth));
    setYear(String(newYear));
  };

  const groupedRecords = useMemo(() => {
    const groups = {};
    for (const record of vacationRecords) {
      const name = record.full_name || record.faculty_name || "Unknown";
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(record);
    }
    return groups;
  }, [vacationRecords]);

  const totalVacationDays = vacationRecords.reduce((sum, r) => sum + (parseFloat(r.duration_days) || parseFloat(r.days) || 0), 0);
  const summerDays = vacationRecords.filter(r => r.special_leave_type === "Summer Vacation" || r.vacation_type === "Summer Vacation").reduce((sum, r) => sum + (parseFloat(r.duration_days) || parseFloat(r.days) || 0), 0);
  const winterDays = vacationRecords.filter(r => r.special_leave_type === "Winter Vacation" || r.vacation_type === "Winter Vacation").reduce((sum, r) => sum + (parseFloat(r.duration_days) || parseFloat(r.days) || 0), 0);

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
        <button onClick={loadVacationCalendar} className="mt-4 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl transition-all">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Vacation Calendar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View faculty vacation schedules and usage</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vacation Days" value={totalVacationDays} icon={Calendar} color="purple" />
        <StatCard title="Faculty on Vacation" value={Object.keys(groupedRecords).length} icon={Sun} color="blue" />
        <StatCard title="Summer Days Used" value={summerDays} icon={Sun} color="amber" />
        <StatCard title="Winter Days Used" value={winterDays} icon={Snowflake} color="cyan" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Year</label>
            <input
              type="number"
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Month</label>
            <select
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString("default", { month: "long" })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
            <input
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              placeholder="Filter by department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Faculty</label>
            <select
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
            >
              <option value="">All Faculty</option>
              {facultyList.map((f) => (
                <option key={f.username} value={f.username}>{f.full_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => { setDepartment(""); setFacultyId(""); }}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all"
          >
            Clear Filters
          </button>
          <button
            onClick={exportToCSV}
            disabled={vacationRecords.length === 0}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        <div className="px-2 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">☀️ Summer Vacation</div>
        <div className="px-2 py-1 rounded-full text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">❄️ Winter Vacation</div>
      </div>

      {/* Vacation Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">Vacation Records</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {vacationRecords.length} vacation record(s) found
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-all"><ChevronLeft size={18} /></button>
              <span className="px-3 py-2 text-sm font-medium">{new Date(parseInt(year), parseInt(month) - 1).toLocaleString("default", { month: "long" })} {year}</span>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-all"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : vacationRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-900/50">
                <tr className="border-b border-slate-200 dark:border-gray-700">
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Faculty</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Department</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Vacation Type</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Period</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Days</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {vacationRecords.map((record) => {
                  const vacationType = record.special_leave_type === "Summer Vacation" ? "Summer Vacation" : 
                                      (record.special_leave_type === "Winter Vacation" ? "Winter Vacation" : 
                                      (record.vacation_type || "Vacation"));
                  const isSummer = vacationType === "Summer Vacation";
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-slate-800 dark:text-white">{record.full_name || record.faculty_name || "-"}</p>
                        <p className="text-xs text-slate-400">{record.user_username || "-"}</p>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{record.department || "-"}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isSummer ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"}`}>
                          {isSummer ? "☀️ Summer" : "❄️ Winter"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                        {record.start_date} → {record.end_date}
                      </td>
                      <td className="p-4 font-medium text-slate-800 dark:text-white">{record.duration_days || record.days || "-"} days</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle size={12} />
                          Approved
                        </span>
                       </td>
                     </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No vacation records found for the selected period
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    cyan: "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400"
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