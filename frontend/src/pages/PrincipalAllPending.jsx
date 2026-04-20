import { useEffect, useState } from "react";
import PrincipalLayout from "./PrincipalLayout";
import api from "../api/axios";

export default function PrincipalAllPending() {
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    role: "",
    leave_type: "",
    page: 1,
    pageSize: 20
  });
  const [result, setResult] = useState({ data: [], total: 0, page: 1, pageSize: 20 });
  const [actionRow, setActionRow] = useState(null);
  const [actionType, setActionType] = useState(""); // approve | reject
  const [comments, setComments] = useState("");

  const load = async () => {
    const { data } = await api.get("/principal/all-pending", { params: filters });
    setResult(data);
  };

  useEffect(() => { load(); }, [filters.page]);

  const applyFilters = () => setFilters((f) => ({ ...f, page: 1 }));

  const openModal = (row, type) => {
    setActionRow(row);
    setActionType(type);
    setComments("");
  };

  const doAction = async () => {
    if (!actionRow) return;
    const isFinal = ["faculty", "officestaff"].includes(actionRow.role);
    const isHod = actionRow.role === "hod";
    const isRegistry = actionRow.role === "registry";

    try {
      if (actionType === "approve") {
        if (isHod) await api.post(`/principal/approve-hod/${actionRow.id}`, { admin_comments: comments });
        else if (isRegistry || isFinal) await api.post(`/principal/final-approve/${actionRow.id}`, { admin_comments: comments });
      } else {
        if (!comments.trim()) return alert("Rejection reason is required");
        if (isHod) await api.post(`/principal/reject-hod/${actionRow.id}`, { admin_comments: comments });
        else if (isRegistry || isFinal) await api.post(`/principal/final-reject/${actionRow.id}`, { admin_comments: comments });
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
        <h1 className="text-2xl font-bold">All Pending Requests</h1>

        <div className="bg-white rounded-2xl p-4 shadow grid md:grid-cols-5 gap-3">
          <input className="border rounded-xl p-2" placeholder="Search name/email/dept" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <input className="border rounded-xl p-2" placeholder="Department" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} />
          <select className="border rounded-xl p-2" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All Roles</option>
            <option value="hod">HOD</option>
            <option value="faculty">Faculty</option>
            <option value="registry">Registry</option>
            <option value="officestaff">Office Staff</option>
          </select>
          <input className="border rounded-xl p-2" placeholder="Leave type/category" value={filters.leave_type} onChange={(e) => setFilters({ ...filters, leave_type: e.target.value })} />
          <button onClick={applyFilters} className="bg-brand-600 text-white rounded-xl px-3">Apply</button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">#</th><th>Employee</th><th>Department</th><th>Role</th><th>Period</th><th>Duration</th><th>Type</th><th>Category</th><th>Reason / Comments</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(result.data || []).map((r, i) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{(result.page - 1) * result.pageSize + i + 1}</td>
                  <td>{r.full_name}<div className="text-slate-500">{r.email}</div></td>
                  <td>{r.department}</td>
                  <td>{r.role}</td>
                  <td>{r.start_date} - {r.end_date}</td>
                  <td>{r.duration_days || "-"}</td>
                  <td>{r.leave_type || "-"}</td>
                  <td>{r.leave_category || "-"}</td>
                  <td>{r.reason || r.hod_comments || "-"}</td>
                  <td className="space-x-1">
                    <button onClick={() => openModal(r, "approve")} className="px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                      {["faculty","officestaff"].includes(r.role) ? "Final Approve" : "Approve"}
                    </button>
                    <button onClick={() => openModal(r, "reject")} className="px-2 py-1 rounded bg-rose-100 text-rose-700">
                      {["faculty","officestaff"].includes(r.role) ? "Final Reject" : "Reject"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(result.data || []).length === 0 && <p className="text-slate-500 py-6 text-center">No pending requests found.</p>}
        </div>

        <div className="flex justify-end gap-2">
          <button disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="px-3 py-2 rounded border bg-white">Prev</button>
          <button disabled={filters.page * filters.pageSize >= result.total} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="px-3 py-2 rounded border bg-white">Next</button>
        </div>
      </div>

      {actionRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-5 space-y-3">
            <h3 className="text-xl font-bold">{actionType === "approve" ? "Approve Request" : "Reject Request"}</h3>
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