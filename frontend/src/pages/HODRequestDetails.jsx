import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Mail,
  Phone,
  Building2,
  AlertCircle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HODRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    loadRequestDetails();
  }, [id]);

  const loadRequestDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/hod/request/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequest(res.data.request || res.data);
      setRemarks((res.data.request && res.data.request.hod_comments) || (res.data.hod_comments || ""));
    } catch (err) {
      console.error("Failed to load request details", err);
      alert(err?.response?.data?.message || "Failed to load request details");
      navigate("/hod-admin/faculty-requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    setProcessing(true);
    try {
      if (status === "approved") {
        // send hod_comments as hod_comments
        await axios.post(
          `${API}/hod/forward-to-principal/${id}`,
          { hod_comments: remarks },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Request approved successfully");
      } else if (status === "rejected") {
        const reason = window.prompt("Rejection reason (required):", "") || "";
        if (!reason.trim()) {
          setProcessing(false);
          return alert("Rejection reason is required");
        }
        await axios.post(
          `${API}/hod/reject-request/${id}`,
          { rejection_reason: reason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Request rejected successfully");
      } else {
        alert("Unknown action");
      }
      navigate("/hod-admin/faculty-requests");
    } catch (err) {
      console.error("Failed to update status", err);
      alert(err?.response?.data?.message || "Failed to update request");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Request not found</p>
        <Link to="/hod-admin/faculty-requests" className="mt-4 inline-block text-brand-600">
          Back to Requests
        </Link>
      </div>
    );
  }

  const isPending = request.status === "pending";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/hod-admin/faculty-requests"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Leave Request Details</h1>
          <p className="text-slate-500 dark:text-slate-400">Review and take action on this request</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Request Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Faculty Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-brand-600" />
              Faculty Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoItem label="Full Name" value={request.full_name} />
              <InfoItem label="Department" value={request.department || "-"} />
              <InfoItem label="Designation" value={request.designation || "Faculty"} />
              <InfoItem label="Email" value={request.email || "-"} icon={Mail} />
              <InfoItem label="Phone" value={request.phone_number || "-"} icon={Phone} />
            </div>
          </div>

          {/* Leave Request Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-brand-600" />
              Leave Request Details
            </h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoItem label="Leave Category" value={request.leave_category} badge />
                <InfoItem label="Number of Days" value={`${request.days} day(s)`} />
                <InfoItem label="Start Date" value={request.start_date} icon={Calendar} />
                <InfoItem label="End Date" value={request.end_date} icon={Calendar} />
              </div>
              
              <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason for Leave
                </label>
                <div className="bg-slate-50 dark:bg-gray-900/50 rounded-xl p-4 text-slate-700 dark:text-slate-300">
                  {request.reason || "No reason provided"}
                </div>
              </div>

              {request.attachment_url && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Attachment
                  </label>
                  <a href={request.attachment_url} target="_blank" rel="noreferrer" className="text-brand-600">
                    View attachment
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* History / Stats omitted for brevity (keeps same) */}
        </div>

        {/* Right Column - Actions */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Actions</h3>

            {!isPending ? (
              <div className="text-center">
                <p className="text-slate-600 dark:text-slate-400 mb-3">This request is <strong className="capitalize">{request.status}</strong></p>
                <p className="text-xs text-slate-500 dark:text-slate-400">HOD-approved: {request.hod_approved ? "Yes" : "No"}</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                    placeholder="Add any remarks or comments..."
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => updateStatus("approved")}
                    disabled={processing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={18} />
                    Approve Request
                  </button>
                  <button
                    onClick={() => updateStatus("rejected")}
                    disabled={processing}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={18} />
                    Reject Request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon, badge }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        {Icon && <Icon size={14} className="text-slate-400" />}
        {badge ? (
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            {value}
          </span>
        ) : (
          <p className="text-slate-800 dark:text-white font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

function BalanceCard({ label, current, after, color }) {
  const colors = {
    blue: "border-blue-200 dark:border-blue-800",
    emerald: "border-emerald-200 dark:border-emerald-800",
    amber: "border-amber-200 dark:border-amber-800"
  };
  
  return (
    <div className={`border rounded-xl p-3 ${colors[color]}`}>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white">{current}</p>
      <p className="text-xs text-emerald-600 dark:text-emerald-400">→ {after}</p>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "approved") {
    return <CheckCircle size={48} className="text-emerald-500 mx-auto" />;
  }
  if (status === "rejected") {
    return <XCircle size={48} className="text-rose-500 mx-auto" />;
  }
  return <Clock size={48} className="text-amber-500 mx-auto" />;
}