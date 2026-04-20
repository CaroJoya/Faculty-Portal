import { useEffect, useState } from "react";
import api from "../api/axios";

export default function CompensationRequest() {
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/overwork/pending-conversions");
      setPending(data || []);
    } catch {
      setPending([]);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    const comments = prompt("Comments (optional):") || "";
    try {
      await api.post(`/overwork/approve-conversion/${id}`, { comments });
      setMsg("Approved");
      load();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Failed");
    }
  };

  const reject = async (id) => {
    const comments = prompt("Rejection reason (required):") || "";
    if (!comments.trim()) return;
    try {
      await api.post(`/overwork/reject-conversion/${id}`, { comments });
      setMsg("Rejected");
      load();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Failed");
    }
  };

  if (!["hod", "registry", "principal"].includes(JSON.parse(localStorage.getItem("user") || "{}")?.role)) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h3 className="font-bold text-lg mb-3">Compensation Requests</h3>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">User</th><th>Role</th><th>Hours</th><th>Earned Days</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.full_name}</td>
                <td>{r.role}</td>
                <td>{r.hours_used}</td>
                <td>{r.earned_days}</td>
                <td>{r.created_at}</td>
                <td className="space-x-2">
                  <button onClick={() => approve(r.id)} className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">Approve</button>
                  <button onClick={() => reject(r.id)} className="px-2 py-1 rounded bg-rose-100 text-rose-700">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pending.length === 0 && <p className="text-slate-500 py-4">No pending compensation requests.</p>}
      </div>
      {msg && <p className="text-indigo-700 text-sm mt-2">{msg}</p>}
    </div>
  );
}