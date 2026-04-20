import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

function leaveDays(start, end, leaveType) {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  if (leaveType === "half_day") return 0.5;
  return diff > 0 ? diff : 0;
}

export default function HODRequestDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [hod_comments, setHodComments] = useState("");
  const [rejection_reason, setRejectionReason] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    api.get(`/hod/request/${id}`).then((r) => setData(r.data));
  }, [id]);

  if (!data) return <div>Loading...</div>;

  const r = data.request;
  const days = leaveDays(r.start_date, r.end_date, r.leave_type);

  const sufficient =
    r.leave_category === "medical"
      ? Number(r.medical_leave_left) >= Number(days)
      : r.leave_category === "casual"
      ? Number(r.casual_leave_left) >= Number(days)
      : Number(r.earned_leave_left) >= Number(days);

  const forward = async () => {
    if (!confirm) return alert("Please confirm review checkbox.");
    await api.post(`/hod/forward-to-principal/${id}`, { hod_comments });
    alert("Forwarded to Principal.");
    nav("/hod-admin/faculty-requests");
  };

  const reject = async () => {
    if (!rejection_reason.trim()) return alert("Rejection reason is required.");
    await api.post(`/hod/reject-request/${id}`, { rejection_reason });
    alert("Request rejected.");
    nav("/hod-admin/faculty-requests");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Request Details</h2>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="font-semibold mb-3">Faculty Information</h3>
            <p><b>Name:</b> {r.full_name}</p>
            <p><b>Department:</b> {r.department}</p>
            <p><b>Email:</b> {r.email}</p>
            <p><b>Phone:</b> {r.phone_number || "-"}</p>
            <p><b>Designation:</b> {r.designation || "-"}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="font-semibold mb-3">Leave Request Details</h3>
            <p><b>Dates:</b> {r.start_date} to {r.end_date}</p>
            <p><b>Duration:</b> {days} day(s)</p>
            <p><b>Category:</b> {r.leave_category}</p>
            <p><b>Type:</b> {r.leave_type}</p>
            <p><b>Special:</b> {r.special_leave_type}</p>
            <p><b>Reason:</b> {r.reason}</p>
            <p><b>Attachment:</b> {r.attachment_path ? <a className="text-brand-700 underline" href={`http://localhost:5000${r.attachment_path}`} target="_blank">Download</a> : "-"}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="font-semibold mb-3">Recent Leave History (Last 5 Approved)</h3>
            <div className="space-y-2 text-sm">
              {data.recent_history.map((x) => (
                <div key={x.id} className="border rounded-xl p-2">
                  {x.start_date} - {x.end_date} | {x.leave_category} | {x.leave_type}
                </div>
              ))}
              {data.recent_history.length === 0 && <p className="text-slate-500">No approved history.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="font-semibold mb-3">Faculty Leave Balances</h3>
            <p>Medical: {r.medical_leave_left}</p>
            <p>Casual: {r.casual_leave_left}</p>
            <p>Earned: {r.earned_leave_left}</p>
            <p className={`mt-2 font-semibold ${sufficient ? "text-emerald-600" : "text-rose-600"}`}>
              {sufficient ? "Sufficient balance" : "Insufficient balance"}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow">
            <h3 className="font-semibold mb-3">Leave Statistics (This Year)</h3>
            <p>Medical taken: {data.leave_statistics.medical_taken}</p>
            <p>Casual taken: {data.leave_statistics.casual_taken}</p>
            <p>Earned taken: {data.leave_statistics.earned_taken}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow space-y-3">
            <h3 className="font-semibold">HOD Decision</h3>
            <textarea
              className="border rounded-xl p-3 w-full"
              rows={3}
              placeholder="Comments to Principal (optional)"
              value={hod_comments}
              onChange={(e) => setHodComments(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              I confirm I have reviewed this request
            </label>

            <button onClick={forward} className="w-full bg-brand-600 text-white py-2 rounded-xl">
              Forward to Principal
            </button>

            <textarea
              className="border rounded-xl p-3 w-full"
              rows={2}
              placeholder="Rejection reason (required for reject)"
              value={rejection_reason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <button onClick={reject} className="w-full bg-rose-600 text-white py-2 rounded-xl">
              Reject Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}