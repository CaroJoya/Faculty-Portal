import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import HeadClerkMarkAttendance from "./HeadClerkMarkAttendance";
import { ChevronLeft, ChevronRight, Search, Download } from "lucide-react";

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

export default function HeadClerkAttendanceCalendar() {
  const d = new Date();
  const [month, setMonth] = useState(d.getMonth() + 1);
  const [year, setYear] = useState(d.getFullYear());
  const [department, setDepartment] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/headclerk/attendance/calendar", {
        params: { month, year, department: department || undefined, faculty_id: facultyId || undefined }
      });
      setFacultyList(data.faculty || []);
      setAttendance(data.attendance || []);
      setLeaveRecords(data.leaveRecords || []);
    } catch (err) {
      console.error("Failed to load calendar data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year, department, facultyId]);

  useEffect(() => {
    if (!facultyId && facultyList.length) setSelectedFaculty(facultyList[0].username);
    else setSelectedFaculty(facultyId);
  }, [facultyId, facultyList]);

  const days = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const attByDate = useMemo(() => {
    const map = new Map();
    for (const a of attendance) map.set(a.date, a);
    return map;
  }, [attendance]);

  const leaveByDate = useMemo(() => {
    const set = new Set();
    for (const lr of leaveRecords) {
      const s = new Date(lr.start_date);
      const e = new Date(lr.end_date);
      for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
        set.add(ymd(dt));
      }
    }
    return set;
  }, [leaveRecords]);

  const filteredFaculty = useMemo(() => {
    if (!searchTerm) return facultyList;
    const term = searchTerm.toLowerCase();
    return facultyList.filter(f => 
      f.full_name.toLowerCase().includes(term) || 
      f.department?.toLowerCase().includes(term)
    );
  }, [facultyList, searchTerm]);

  const onDayClick = (day) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const fid = facultyId || selectedFaculty || facultyList?.[0]?.username;
    if (!fid) return alert("Please select a faculty member first");
    setSelectedFaculty(fid);
    setSelectedDate(date);
    setOpenModal(true);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to download PDF");
      return;
    }
    
    const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
    const title = `Attendance Calendar - ${monthName} ${year}`;
    
    let calendarHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 20px;
            padding: 20px;
            background: white;
          }
          h1 {
            color: #1e293b;
            text-align: center;
            margin-bottom: 10px;
          }
          .subtitle {
            text-align: center;
            color: #64748b;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 12px 8px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background-color: #f1f5f9;
            font-weight: 600;
            color: #1e293b;
          }
          .status-present {
            background-color: #dcfce7;
            color: #166534;
          }
          .status-absent {
            background-color: #fee2e2;
            color: #991b1b;
          }
          .status-half {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-leave {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
    `;
    
    // Faculty table
    calendarHTML += `
      <h3 style="margin-top: 20px;">Faculty Attendance Records</h3>
      <table>
        <thead>
          <tr>
            <th>Faculty Name</th>
            <th>Department</th>
            <th>Role</th>
            <th>Medical Leave</th>
            <th>Casual Leave</th>
            <th>Earned Leave</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    for (const faculty of facultyList.slice(0, 20)) {
      calendarHTML += `
          <tr>
            <td>${faculty.full_name}</td>
            <td>${faculty.department || '-'}</td>
            <td>${faculty.role}</td>
            <td>${faculty.medical_leave_left || 0}</td>
            <td>${faculty.casual_leave_left || 0}</td>
            <td>${faculty.earned_leave_left || 0}</td>
          </tr>
      `;
    }
    
    calendarHTML += `
        </tbody>
      </table>
    `;
    
    // Attendance summary
    calendarHTML += `
      <h3 style="margin-top: 30px;">Attendance Summary for ${monthName} ${year}</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Half Day</th>
            <th>On Leave</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    for (let day = 1; day <= days; day++) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      let present = 0, absent = 0, halfDay = 0, onLeave = 0;
      
      for (const faculty of facultyList) {
        const att = attendance.find(a => a.date === date && a.user_username === faculty.username);
        const hasLeave = leaveRecords.some(lr => {
          const start = new Date(lr.start_date);
          const end = new Date(lr.end_date);
          const current = new Date(date);
          return lr.user_username === faculty.username && current >= start && current <= end;
        });
        
        if (hasLeave) onLeave++;
        else if (att?.status === "Present") present++;
        else if (att?.status === "Absent") absent++;
        else if (att?.status === "Half Day") halfDay++;
      }
      
      calendarHTML += `
          <tr>
            <td>${date}</td>
            <td>${present}</td>
            <td>${absent}</td>
            <td>${halfDay}</td>
            <td>${onLeave}</td>
          </tr>
      `;
    }
    
    calendarHTML += `
        </tbody>
      </table>
      <div class="footer">
        This report is generated automatically by the Faculty Leave Portal. For queries, contact the Head Clerk.
      </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(calendarHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const getAttendanceSummary = () => {
    let present = 0, absent = 0, halfDay = 0;
    for (const a of attendance) {
      if (a.status === "Present") present++;
      else if (a.status === "Absent") absent++;
      else if (a.status === "Half Day") halfDay++;
    }
    return { present, absent, halfDay };
  };

  const summary = getAttendanceSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Attendance Calendar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage faculty attendance records</p>
        </div>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all"
        >
          <Download size={16} />
          Download as PDF
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.present}</p>
          <p className="text-xs text-slate-500">Present Records</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{summary.absent}</p>
          <p className="text-xs text-slate-500">Absent Records</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.halfDay}</p>
          <p className="text-xs text-slate-500">Half Day Records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Faculty Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
            <input
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
              placeholder="e.g., Computer Engineering"
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setFacultyId(""); }}
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
              {filteredFaculty.map((f) => (
                <option key={f.username} value={f.username}>{f.full_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
          {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {year}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-gray-700">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-gray-900/50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-gray-700">
            {Array.from({ length: emptyDays }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50 dark:bg-gray-900/50 p-2" />
            ))}
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
              const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const a = attByDate.get(date);
              const hasLeave = leaveByDate.has(date);
              const isToday = ymd(new Date()) === date;
              
              let statusClass = "";
              let statusText = "";
              
              if (a?.status === "Present") {
                statusClass = "bg-emerald-50 dark:bg-emerald-950/20";
                statusText = "✓ Present";
              } else if (a?.status === "Absent") {
                statusClass = "bg-rose-50 dark:bg-rose-950/20";
                statusText = "✗ Absent";
              } else if (a?.status === "Half Day") {
                statusClass = "bg-amber-50 dark:bg-amber-950/20";
                statusText = "½ Half Day";
              } else if (hasLeave) {
                statusClass = "bg-blue-50 dark:bg-blue-950/20";
                statusText = "L Leave";
              }
              
              return (
                <button
                  key={day}
                  onClick={() => onDayClick(day)}
                  className={`min-h-[100px] p-2 text-left transition-all hover:bg-slate-100 dark:hover:bg-gray-800 ${
                    isToday ? "ring-2 ring-brand-500 ring-inset" : ""
                  } ${statusClass || "bg-white dark:bg-gray-800"}`}
                >
                  <span className={`text-sm font-medium ${isToday ? "text-brand-600 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                    {day}
                  </span>
                  {statusText && (
                    <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {statusText}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Faculty List Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h3 className="font-semibold text-slate-800 dark:text-white">Faculty List</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{facultyList.length} faculty members</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50">
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Name</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Department</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Role</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {filteredFaculty.slice(0, 10).map((f) => (
                <tr key={f.username} className="hover:bg-slate-50 dark:hover:bg-gray-900/30">
                  <td className="p-4">
                    <p className="font-medium text-slate-800 dark:text-white">{f.full_name}</p>
                    <p className="text-xs text-slate-400">{f.username}</p>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{f.department || "-"}</td>
                  <td className="p-4">
                    <span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-700">
                      {f.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setFacultyId(f.username);
                        setSelectedFaculty(f.username);
                      }}
                      className="text-sm text-brand-600 hover:text-brand-700"
                    >
                      View Attendance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {openModal && (
        <HeadClerkMarkAttendance
          facultyId={selectedFaculty}
          date={selectedDate}
          onClose={() => setOpenModal(false)}
          onSaved={() => { setOpenModal(false); load(); }}
        />
      )}
    </div>
  );
}