import { useEffect, useState } from "react";
import PrincipalLayout from "./PrincipalLayout";
import api from "../api/axios";

export default function PrincipalHODPending() {
  const [rows, setRows] = useState([]);
  const [actionRow, setActionRow] = useState(null);
  const [actionType, setActionType] = useState("");
  const [comments, setComments] = useState("");

  const load = async () => {
    const { data } = await api.get("/principal/hod-pending");
    setRows(data || []);
  };

  useEffect(() => { load(); }, []);

  const openModal = (row, type) => {
    setActionRow(row);
    setActionType(type);
    setComments("");
  };

  const doAction = async () => {
    if (!actionRow) return;
    try {
      if (actionType === "approve") {
        await api.post(`/principal/approve-hod/${actionRow.id}`, { admin_comments: comments });
      } else {
        if (!comments.trim()) return alert("Rejection reason is required");
        await api.post(`/principal/reject-hod/${actionRow.id}`, { admin_comments: comments });
      }
      setActionRow(null);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Action failed");
    }
  };

  return (
    <PrincipalLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">HOD Pending Requests</h1>

        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b"><th className="py-2">#</th><th>HOD Details</th><th>Department</th><th>Period</th><th>Duration</th><th>Type</th><th>Category</th><th>Reason</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{i + 1}</td>
                  <td>{r.full_name}<div className="text-slate-500">{r.email}</div></td>
                  <td>{r.department}</td>
                  <td>{r.start_date} - {r.end_date}</td>
                  <td>{r.duration_days || "-"}</td>
                  <td>{r.leave_type || "-"}</td>
                  <td>{r.leave_category || "-"}</td>
                  <td>{r.reason || "-"}</td>
                  <td className="space-x-1">
                    <button onClick={() => openModal(r, "approve")} className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">Approve</button>
                    <button onClick={() => openModal(r, "reject")} className="px-2 py-1 rounded bg-rose-100 text-rose-700">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-slate-500 py-6 text-center">No pending HOD requests.</p>}
        </div>
      </div>

      {actionRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 space-y-3">
            <h3 className="text-xl font-bold">{actionType === "approve" ? "Approve HOD Request" : "Reject HOD Request"}</h3>
            <p className="text-sm text-slate-600">{actionRow.full_name} • {actionRow.department} • {actionRow.start_date} to {actionRow.end_date}</p>
            <textarea
              rows={4}
              className="w-full border rounded-xl p-3"
              placeholder={actionType === "approve" ? "Principal comments (optional)" : "Rejection reason (required)"}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setActionRow(null)} className="flex-1 py-2 rounded-xl border">Cancel</button>
              <button onClick={doAction} className={`flex-1 py-2 rounded-xl text-white ${actionType === "approve" ? "bg-emerald-600" : "bg-rose-600"}`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </PrincipalLayout>
  );
}