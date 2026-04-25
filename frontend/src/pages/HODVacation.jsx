import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Calendar, 
  Sun, 
  Snowflake, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  Building2
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HODVacation() {
  const token = localStorage.getItem("token");
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [departmentStats, setDepartmentStats] = useState({
    totalFaculty: 0,
    onVacation: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    loadVacations();
    loadDepartmentStats();
  }, []);

  const loadVacations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/hod/vacations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVacations(res.data);
    } catch (err) {
      console.error("Failed to load vacations", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentStats = async () => {
    try {
      const res = await axios.get(`${API}/hod/department-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartmentStats(res.data);
    } catch (err) {
      console.error("Failed to load department stats", err);
    }
  };

  const getVacationDaysInMonth = (vacation, year, month) => {
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    const days = [];
    
    let current = new Date(start);
    while (current <= end) {
      if (current.getFullYear() === year && current.getMonth() === month) {
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const groupVacationsByDate = () => {
    const grouped = {};
    vacations.forEach(vacation => {
      const start = new Date(vacation.start_date);
      const end = new Date(vacation.end_date);
      let current = new Date(start);
      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(vacation);
        current.setDate(current.getDate() + 1);
      }
    });
    return grouped;
  };

  const getVacationTypeIcon = (type) => {
    if (type === 'summer') return <Sun size={16} className="text-amber-500" />;
    if (type === 'winter') return <Snowflake size={16} className="text-blue-400" />;
    return <Calendar size={16} className="text-brand-500" />;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      approved: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      rejected: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const groupedVacations = groupVacationsByDate();
    const weeks = [];
    let days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      const dayVacations = groupedVacations[dateKey] || [];
      days.push({ day, date, vacations: dayVacations });
    }
    
    // Split into weeks
    while (days.length) {
      weeks.push(days.splice(0, 7));
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`min-h-[80px] p-1 rounded-lg border ${
                    day 
                      ? day.vacations.length > 0
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40'
                        : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700'
                      : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700'
                  } transition-colors`}
                  onClick={() => day && day.vacations.length > 0 && handleDayClick(day.date, day.vacations)}
                >
                  {day && (
                    <>
                      <div className="text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                        {day.day}
                      </div>
                      {day.vacations.length > 0 && (
                        <div className="mt-1">
                          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            {day.vacations.length} faculty
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleDayClick = (date, vacations) => {
    setSelectedVacation({ date, vacations });
    setShowModal(true);
  };

  // Group vacations by type for list view
  const summerVacations = vacations.filter(v => v.vacation_type === 'summer' && v.status === 'approved');
  const winterVacations = vacations.filter(v => v.vacation_type === 'winter' && v.status === 'approved');
  const shortVacations = vacations.filter(v => v.vacation_type === 'short' && v.status === 'approved');
  const pendingVacations = vacations.filter(v => v.status === 'pending');

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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Department Vacation Calendar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View faculty vacation schedules and requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Faculty" 
          value={departmentStats.totalFaculty} 
          icon={Users}
          color="blue"
        />
        <StatCard 
          title="On Vacation" 
          value={departmentStats.onVacation} 
          icon={Calendar}
          color="amber"
        />
        <StatCard 
          title="Pending Requests" 
          value={departmentStats.pendingRequests || pendingVacations.length} 
          icon={Clock}
          color="purple"
        />
        <StatCard 
          title="Active Vacations" 
          value={shortVacations.length + summerVacations.length + winterVacations.length} 
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Calendar View */}
      {renderCalendar()}

      {/* Vacation Lists by Type */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Summer Vacations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-800">
            <div className="flex items-center gap-2">
              <Sun size={20} className="text-amber-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Summer Vacation</h3>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {summerVacations.length > 0 ? (
              summerVacations.map(vacation => (
                <VacationCard key={vacation.id} vacation={vacation} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                No summer vacations scheduled
              </div>
            )}
          </div>
        </div>

        {/* Winter Vacations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-800">
            <div className="flex items-center gap-2">
              <Snowflake size={20} className="text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Winter Vacation</h3>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {winterVacations.length > 0 ? (
              winterVacations.map(vacation => (
                <VacationCard key={vacation.id} vacation={vacation} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                No winter vacations scheduled
              </div>
            )}
          </div>
        </div>

        {/* Short Vacations (7-day) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-800">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Short Vacations (7-day)</h3>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {shortVacations.length > 0 ? (
              shortVacations.map(vacation => (
                <VacationCard key={vacation.id} vacation={vacation} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                No short vacations scheduled
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-800">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-amber-500" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Pending Vacation Requests</h3>
              {pendingVacations.length > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingVacations.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {pendingVacations.length > 0 ? (
              pendingVacations.map(vacation => (
                <PendingVacationCard 
                  key={vacation.id} 
                  vacation={vacation} 
                  onUpdate={loadVacations}
                  token={token}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                No pending vacation requests
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for day details */}
      {showModal && selectedVacation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 shadow-xl">
            <div className="p-5 border-b border-slate-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Vacations on {new Date(selectedVacation.date).toLocaleDateString()}
              </h3>
            </div>
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {selectedVacation.vacations.map((vacation, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-800 dark:text-white">{vacation.faculty_name}</p>
                    {getVacationTypeIcon(vacation.vacation_type)}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {vacation.vacation_type === 'summer' ? 'Summer Vacation' : 
                     vacation.vacation_type === 'winter' ? 'Winter Vacation' : 'Short Vacation'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {vacation.start_date} → {vacation.end_date}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
  };
  
  return (
    <div className={`${colors[color]} rounded-2xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-xl bg-white/20 dark:bg-black/20">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function VacationCard({ vacation }) {
  return (
    <div className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-slate-400" />
          <p className="font-medium text-slate-800 dark:text-white">{vacation.faculty_name}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
        {vacation.start_date} → {vacation.end_date}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
        {vacation.days} days
      </p>
    </div>
  );
}

function PendingVacationCard({ vacation, onUpdate, token }) {
  const [processing, setProcessing] = useState(false);

  const updateStatus = async (status) => {
    setProcessing(true);
    try {
      await axios.put(
        `${API}/hod/vacations/${vacation.id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate();
    } catch (err) {
      console.error("Failed to update vacation status", err);
      alert(err?.response?.data?.message || "Failed to update request");
    } finally {
      setProcessing(false);
    }
  };

  const getVacationTypeLabel = (type) => {
    if (type === 'summer') return 'Summer Vacation (40 days)';
    if (type === 'winter') return 'Winter Vacation (40 days)';
    return 'Short Vacation (7 days)';
  };

  const getVacationTypeColor = (type) => {
    if (type === 'summer') return 'text-amber-600 dark:text-amber-400';
    if (type === 'winter') return 'text-blue-600 dark:text-blue-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-slate-800 dark:text-white">{vacation.faculty_name}</p>
          <p className={`text-xs font-medium ${getVacationTypeColor(vacation.vacation_type)}`}>
            {getVacationTypeLabel(vacation.vacation_type)}
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {vacation.start_date} → {vacation.end_date}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
        {vacation.days} days
      </p>
      {vacation.reason && (
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
          Reason: {vacation.reason}
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => updateStatus('approved')}
          disabled={processing}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <CheckCircle size={14} />
          Approve
        </button>
        <button
          onClick={() => updateStatus('rejected')}
          disabled={processing}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <XCircle size={14} />
          Reject
        </button>
      </div>
    </div>
  );
}