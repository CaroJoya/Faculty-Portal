import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COLOR_MAP = {
  Present: "bg-green-500 text-white",
  Absent: "bg-red-500 text-white",
  "Half Day": "bg-orange-500 text-white",
  "Casual Leave": "bg-yellow-400 text-black",
  "Medical Leave": "bg-red-600 text-white",
  "Earned Leave": "bg-blue-500 text-white"
};

const ICON_MAP = {
  Present: "✓",
  Absent: "✗",
  "Half Day": "½",
  "Casual Leave": "C",
  "Medical Leave": "M",
  "Earned Leave": "E"
};

export default function HeadClerkAttendanceCalendar() {
  const token = localStorage.getItem("token");
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [department, setDepartment] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [facultyId, setFacultyId] = useState("");
  const [calendar, setCalendar] = useState({ attendance: [], leaveRecords: [] });

  const loadFaculty = async () => {
    const res = await axios.get(`${API}/headclerk/faculty/by-department`, {
      params: { department: department || undefined },
      headers: { Authorization: `Bearer ${token}` }
    });
    setFacultyList(res.data || []);
    if (facultyId && !(res.data || []).find((f) => f.username === facultyId)) setFacultyId("");
  };

  const loadCalendar = async () => {
    const res = await axios.get(`${API}/headclerk/attendance/calendar`, {
      params: { month, year, department: department || undefined, faculty_id: facultyId || undefined },
      headers: { Authorization: `Bearer ${token}` }
    });
    setCalendar(res.data || { attendance: [], leaveRecords: [] });
  };

  useEffect(() => { loadFaculty(); }, [department]);
  useEffect(() => { loadCalendar(); }, [month, year, department, facultyId]);

  const rows = useMemo(() => {
    const map = {};
    (calendar.attendance || []).forEach((a) => {
      map[a.date] = { label: a.status, type: a.status };
    });

    (calendar.leaveRecords || []).forEach((l) => {
      const label =
        l.leave_category === "casual" ? "Casual Leave" :
        l.leave_category === "medical" ? "Medical Leave" :
        l.leave_category === "earned" ? "Earned Leave" :
        null;

      if (!label) return;

      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        map[key] = { label, type: label };
      }
    });

    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [calendar]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Head Clerk Attendance Calendar</h1>

      <div className="grid md:grid-cols-4 gap-2 bg-white p-3 rounded shadow">
        <input className="border rounded px-2 py-2" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Month (1-12)" value={month} onChange={(e) => setMonth(e.target.value)} />
        <input className="border rounded px-2 py-2" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <select className="border rounded px-2 py-2" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
          <option value="">All Faculty</option>
          {facultyList.map((f) => <option key={f.username} value={f.username}>{f.full_name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {Object.keys(COLOR_MAP).map((k) => (
          <div key={k} className={`px-2 py-1 rounded ${COLOR_MAP[k]}`}>
            {ICON_MAP[k]} {k}
          </div>
        ))}
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Status</th></tr>
          </thead>
          <tbody>
            {rows.map(([date, v]) => (
              <tr key={date} className="border-t">
                <td className="p-2">{date}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${COLOR_MAP[v.type] || "bg-gray-200"}`}>
                    {ICON_MAP[v.type] || "-"} {v.label}
                  </span>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-2" colSpan={2}>No records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}