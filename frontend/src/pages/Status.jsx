import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Status() {
  const [tab, setTab] = useState("leave");
  const [leave, setLeave] = useState([]);
  const [extra, setExtra] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/leave-requests"), api.get("/extra-work")]).then(([l, e]) => {
      setLeave(l.data || []);
      setExtra(e.data || []);
    });
  }, []);

  const specialCounts = leave.reduce(
    (acc, x) => {
      if (x.special_leave_type === "od") acc.od += 1;
      if (x.special_leave_type === "extended_medical") acc.extended += 1;
      if (x.special_leave_type === "maternity") acc.maternity += 1;
      return acc;
    },
    { od: 0, extended: 0, maternity: 0 }
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Status</h2>

      <div className="flex gap-2">
        <button onClick={() => setTab("leave")} className={`px-4 py-2 rounded-xl ${tab === "leave" ? "bg-brand-600 text-white" : "bg-white"}`}>Leave Requests</button>
        <button onClick={() => setTab("comp")} className={`px-4 py-2 rounded-xl ${tab === "comp" ? "bg-brand-600 text-white" : "bg-white"}`}>Compensation Requests</button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow flex gap-2 text-sm">
        <Badge t={`OD: ${specialCounts.od}`} />
        <Badge t={`Extended Medical: ${specialCounts.extended}`} />
        <Badge t={`Maternity/Paternity: ${specialCounts.maternity}`} />
      </div>

      {tab === "leave" ? (
        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Dates</th>
                <th>Duration</th>
                <th>Type</th>
                <th>Category</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Attachment</th>
              </tr>
            </thead>
            <tbody>
              {leave.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.start_date} - {r.end_date}</td>
                  <td>{r.leave_type}</td>
                  <td>
                    <span className="px-2 py-1 rounded-full bg-slate-100">{r.special_leave_type}</span>
                  </td>
                  <td>{r.leave_category}</td>
                  <td>{r.reason}</td>
                  <td><StatusPill s={r.status} /></td>
                  <td>{r.created_at}</td>
                  <td>{r.attachment_path ? <a className="text-brand-700 underline" href={`http://localhost:5000${r.attachment_path}`} target="_blank">View</a> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Work Date</th>
                <th>Hours</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {extra.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.work_date}</td>
                  <td>{r.hours_worked}</td>
                  <td>{r.work_type}</td>
                  <td>{r.reason}</td>
                  <td><StatusPill s={r.status} /></td>
                  <td>{r.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ s }) {
  const map = {
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700"
  };
  return <span className={`px-2 py-1 rounded-full ${map[s] || "bg-slate-100 text-slate-700"}`}>{s}</span>;
}
function Badge({ t }) {
  return <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">{t}</span>;
}