import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import HeadClerkMarkAttendance from "./HeadClerkMarkAttendance";

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

  const load = async () => {
    const { data } = await api.get("/headclerk/attendance/calendar", {
      params: { month, year, department: department || undefined, faculty_id: facultyId || undefined }
    });
    setFacultyList(data.faculty || []);
    setAttendance(data.attendance || []);
    setLeaveRecords(data.leaveRecords || []);
  };

  useEffect(() => { load(); }, [month, year, department, facultyId]);

  useEffect(() => {
    if (!facultyId && facultyList.length) setSelectedFaculty(facultyList[0].username);
    else setSelectedFaculty(facultyId);
  }, [facultyId, facultyList]);

  const days = getDaysInMonth(year, month);

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

  const onDayClick = (day) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const fid = facultyId || selectedFaculty || facultyList?.[0]?.username;
    if (!fid) return alert("Select faculty first");
    setSelectedFaculty(fid);
    setSelectedDate(date);
    setOpenModal(true);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm">Department</label>
          <input className="block border rounded-xl p-2 bg-white" placeholder="e.g. Computer" value={department} onChange={(e) => { setDepartment(e.target.value); setFacultyId(""); }} />
        </div>

        <div>
          <label className="text-sm">Faculty</label>
          <select className="block border rounded-xl p-2 bg-white" value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
            <option value="">All / Select</option>
            {facultyList.map((f) => <option key={f.username} value={f.username}>{f.full_name}</option>)}
          </select>
        </div>

        <button onClick={prevMonth} className="px-3 py-2 rounded-xl border bg-white">Prev</button>
        <div className="font-semibold">{year}-{String(month).padStart(2, "0")}</div>
        <button onClick={nextMonth} className="px-3 py-2 rounded-xl border bg-white">Next</button>

        <button onClick={() => window.print()} className="ml-auto px-3 py-2 rounded-xl bg-brand-600 text-white">Print</button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
          const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const a = attByDate.get(date);
          const hasLeave = leaveByDate.has(date);
          const today = ymd(new Date()) === date;

          return (
            <button key={day} onClick={() => onDayClick(day)} className={`min-h-[90px] p-2 rounded-xl border text-left ${today ? "border-brand-500 bg-brand-50" : "bg-white"}`}>
              <div className="font-semibold">{day}</div>
              {a && <span className="inline-block mt-1 text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">{a.status}</span>}
              {hasLeave && <span className="inline-block mt-1 text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Leave</span>}
            </button>
          );
        })}
      </div>

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