import { useEffect, useState } from "react";
import api from "../api/axios";

export default function HeadClerkVacationCalendar() {
  const d = new Date();
  const [month, setMonth] = useState(d.getMonth() + 1);
  const [year, setYear] = useState(d.getFullYear());
  const [department, setDepartment] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await api.get("/headclerk/vacation/calendar", {
      params: {
        month,
        year,
        department: department || undefined,
        faculty_id: facultyId || undefined
      }
    });
    setRows(data || []);
  };

  useEffect(() => {
    load();
  }, [month, year, department, facultyId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <input
          className="border rounded-xl p-2 bg-white"
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        <input
          className="border rounded-xl p-2 bg-white"
          placeholder="Faculty username"
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value)}
        />
        <button
          onClick={() => setMonth((m) => (m === 1 ? 12 : m - 1))}
          className="px-3 py-2 rounded-xl border bg-white"
        >
          Prev
        </button>
        <div className="font-semibold">{year}-{String(month).padStart(2, "0")}</div>
        <button
          onClick={() => setMonth((m) => (m === 12 ? 1 : m + 1))}
          className="px-3 py-2 rounded-xl border bg-white"
        >
          Next
        </button>
        <button
          onClick={() => window.print()}
          className="ml-auto px-3 py-2 rounded-xl bg-brand-600 text-white"
        >
          Print
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Faculty</th>
              <th>Department</th>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.full_name}</td>
                <td>{r.department}</td>
                <td>{r.start_date}</td>
                <td>{r.end_date}</td>
                <td title={r.reason}>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}