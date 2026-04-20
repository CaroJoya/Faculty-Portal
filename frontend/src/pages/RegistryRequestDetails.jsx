import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

export default function RegistryRequestDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [comments, setComments] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    api.get(`/registry/request/${id}`).then((r) => setData(r.data));
  }, [id]);

  if (!data) return <div>Loading...</div>;
  const r = data.request;

  const approve = async () => {
    if (!confirm) return alert("Please confirm review");
    await api.post(`/registry/approve-forward/${id}`, { comments });
    alert("Forwarded to Principal");
    nav("/registry-admin/staff-requests");
  };

  const reject = async () => {
    if (!reason.trim()) return alert("Rejection reason required");
    await api.post(`/registry/reject-request/${id}`, { rejection_reason: reason });
    alert("Rejected");
    nav("/registry-admin/staff-requests");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Staff Request Details</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow space-y-2">
          <p><b>Name:</b> {r.full_name}</p>
          <p><b>Department:</b> {r.department}</p>
          <p><b>Email:</b> {r.email}</p>
          <p><b>Dates:</b> {r.start_date} - {r.end_date}</p>
          <p><b>Category:</b> {r.leave_category}</p>
          <p><b>Type:</b> {r.leave_type}</p>
          <p><b>Reason:</b> {r.reason}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow space-y-3">
          <textarea className="border rounded-xl p-3 w-full" rows={3} placeholder="Comments to Principal (optional)" value={comments} onChange={(e) => setComments(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
            I confirm I have reviewed this request
          </label>
          <button onClick={approve} className="w-full bg-brand-600 text-white py-2 rounded-xl">Approve & Forward to Principal</button>
          <textarea className="border rounded-xl p-3 w-full" rows={2} placeholder="Rejection reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button onClick={reject} className="w-full bg-rose-600 text-white py-2 rounded-xl">Reject Request</button>
        </div>
      </div>
    </div>
  );
}