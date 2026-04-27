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
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/registry/request/${id}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load request", err);
      alert(err?.response?.data?.message || "Failed to load request");
      nav("/registry-admin/staff-requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div className="text-center py-12">Request not found</div>;

  const r = data.request;

  const approve = async () => {
    if (!confirm) return alert("Please confirm review");
    setProcessing(true);
    try {
      await api.post(`/registry/approve-forward/${id}`, { comments });
      alert("Approved by Registry and forwarded to Principal. (Registry/HOD is final approver; Principal can only reject before start date.)");
      nav("/registry-admin/staff-requests");
    } catch (err) {
      console.error("Approve error", err);
      alert(err?.response?.data?.message || "Failed to approve");
    } finally {
      setProcessing(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) return alert("Rejection reason required");
    setProcessing(true);
    try {
      await api.post(`/registry/reject-request/${id}`, { rejection_reason: reason });
      alert("Request rejected. It will not be forwarded to Principal.");
      nav("/registry-admin/staff-requests");
    } catch (err) {
      console.error("Reject error", err);
      alert(err?.response?.data?.message || "Failed to reject");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Staff Request Details</h2>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-2 border border-slate-200 dark:border-gray-700">
          <p className="text-slate-700 dark:text-slate-300"><b>Name:</b> {r.full_name}</p>
          <p className="text-slate-700 dark:text-slate-300"><b>Department:</b> {r.department}</p>
          <p className="text-slate-700 dark:text-slate-300"><b>Email:</b> {r.email}</p>
          <p className="text-slate-700 dark:text-slate-300"><b>Dates:</b> {r.start_date} - {r.end_date}</p>
          <p className="text-slate-700 dark:text-slate-300"><b>Category:</b> {r.leave_category}</p>
          <p className="text-slate-700 dark:text-slate-300"><b>Type:</b> {r.leave_type}</p>
          <p className="text-slate-700 dark:text-slate-300"><b>Reason:</b> {r.reason}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-3 border border-slate-200 dark:border-gray-700">
          <textarea
            className="border rounded-xl p-3 w-full bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700"
            rows={3}
            placeholder="Comments to Principal (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={processing}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} disabled={processing} />
            I confirm I have reviewed this request
          </label>
          <button
            onClick={approve}
            className="w-full bg-emerald-600 text-white py-2 rounded-xl"
            disabled={processing}
            title="Approve and forward to Principal"
          >
            {processing ? "Processing..." : "Approve & Forward to Principal"}
          </button>

          <textarea
            className="border rounded-xl p-3 w-full bg-white dark:bg-gray-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-gray-700"
            rows={2}
            placeholder="Rejection reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={processing}
          />
          <button
            onClick={reject}
            className="w-full bg-rose-600 text-white py-2 rounded-xl"
            disabled={processing}
            title="Reject request"
          >
            {processing ? "Processing..." : "Reject Request"}
          </button>
        </div>
      </div>
    </div>
  );
}