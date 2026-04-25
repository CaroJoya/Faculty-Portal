import React, { useMemo, useState } from "react";
import axios from "axios";
import { 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  Users,
  Sun,
  Heart,
  Briefcase,
  Baby,
  Award,
  X
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function RequestLeave() {
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    leave_type: "full_day",
    leave_category: "casual",
    special_leave_type: "regular",
    reason: ""
  });
  const [attachment, setAttachment] = useState(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(["", "", ""]);
  const [showRecs, setShowRecs] = useState(false);

  const token = localStorage.getItem("token");
  
  const userRole = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.role;
    } catch {
      return null;
    }
  }, []);

  const duration = useMemo(() => {
    if (!form.start_date) return 0;
    if (form.leave_type === "half_day") return 0.5;
    if (!form.end_date) return 0;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    const d = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return d > 0 ? d : 0;
  }, [form.start_date, form.end_date, form.leave_type]);

  const leaveCategoryInfo = {
    casual: { icon: Sun, label: "Casual Leave", description: "For personal reasons, vacation, or short breaks", color: "amber" },
    medical: { icon: Heart, label: "Medical Leave", description: "For health-related issues or medical appointments", color: "rose" },
    earned: { icon: Award, label: "Earned Leave", description: "Earned through overwork or previous years", color: "emerald" }
  };

  const specialLeaveInfo = {
    regular: { icon: Calendar, label: "Regular Leave", description: "Standard leave request" },
    od: { icon: Briefcase, label: "On Duty (OD)", description: "Official duty outside campus - OD letter required" },
    maternity: { icon: Baby, label: "Maternity/Paternity", description: "Parental leave (180 days available)" },
    extended_medical: { icon: Heart, label: "Extended Medical", description: "Long-term medical leave" }
  };

  const onChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "leave_type" && value === "half_day") {
        next.end_date = next.start_date;
      }
      if (key === "start_date" && next.leave_type === "half_day") {
        next.end_date = value;
      }
      return next;
    });
  };

  const updateRecommendation = (index, value) => {
    const newRecs = [...recommendations];
    newRecs[index] = value;
    setRecommendations(newRecs);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    if (!form.start_date || !form.reason) {
      setMsg("Start date and reason are required");
      setMsgType("error");
      return;
    }

    const effectiveEnd = form.leave_type === "half_day" ? form.start_date : form.end_date;
    if (!effectiveEnd) {
      setMsg("End date is required");
      setMsgType("error");
      return;
    }

    if (form.special_leave_type.toLowerCase() === "od" && !attachment) {
      setMsg("OD letter upload is mandatory for OD leave.");
      setMsgType("error");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("start_date", form.start_date);
      fd.append("end_date", effectiveEnd);
      fd.append("leave_type", form.leave_type);
      fd.append("leave_category", form.leave_category);
      fd.append("special_leave_type", form.special_leave_type);
      fd.append("reason", form.reason);
      if (attachment) fd.append("attachment", attachment);
      
      const nonEmptyRecs = recommendations.filter(r => r.trim() !== "");
      if (nonEmptyRecs.length > 0) {
        fd.append("recommendations", JSON.stringify(nonEmptyRecs));
      }

      const res = await axios.post(`${API}/leave-requests`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setMsg(res.data?.message || "Leave request submitted successfully!");
      setMsgType("success");
      setForm({
        start_date: "",
        end_date: "",
        leave_type: "full_day",
        leave_category: "casual",
        special_leave_type: "regular",
        reason: ""
      });
      setAttachment(null);
      setRecommendations(["", "", ""]);
      setShowRecs(false);
      
      setTimeout(() => setMsg(""), 5000);
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to submit leave request");
      setMsgType("error");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setForm({
      start_date: "",
      end_date: "",
      leave_type: "full_day",
      leave_category: "casual",
      special_leave_type: "regular",
      reason: ""
    });
    setAttachment(null);
    setRecommendations(["", "", ""]);
    setShowRecs(false);
    setMsg("");
  };

  const currentCategoryInfo = leaveCategoryInfo[form.leave_category] || leaveCategoryInfo.casual;
  const currentSpecialInfo = specialLeaveInfo[form.special_leave_type] || specialLeaveInfo.regular;
  const CategoryIcon = currentCategoryInfo.icon;
  const SpecialIcon = currentSpecialInfo.icon;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Request Leave</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Submit a new leave request for approval</p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Approval Workflow</p>
            <p className="mt-0.5">Your request will be reviewed by your HOD and forwarded to the Principal for final approval.</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {/* Form Header */}
        <div className="p-5 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
          <h2 className="font-semibold text-slate-800 dark:text-white">Leave Application Form</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Fill in the details below</p>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5">
          {/* Date Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none transition-all"
                value={form.start_date}
                onChange={(e) => onChange("start_date", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                End Date {form.leave_type === "half_day" && "(Auto-set)"}
              </label>
              <input
                type="date"
                className={`w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none transition-all ${form.leave_type === "half_day" ? "bg-slate-100 dark:bg-gray-700 cursor-not-allowed" : ""}`}
                value={form.leave_type === "half_day" ? form.start_date : form.end_date}
                disabled={form.leave_type === "half_day"}
                onChange={(e) => onChange("end_date", e.target.value)}
                required={form.leave_type !== "half_day"}
              />
            </div>
          </div>

          {/* Leave Type Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Leave Type
              </label>
              <select
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                value={form.leave_type}
                onChange={(e) => onChange("leave_type", e.target.value)}
              >
                <option value="full_day">Full Day</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Duration
              </label>
              <div className="border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-gray-900">
                <span className="font-medium text-slate-800 dark:text-white">{duration} day(s)</span>
              </div>
            </div>
          </div>

          {/* Leave Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Leave Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(leaveCategoryInfo).map(([key, info]) => {
                const Icon = info.icon;
                const isSelected = form.leave_category === key;
                const colorClasses = {
                  amber: isSelected ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-slate-200 dark:border-gray-700",
                  rose: isSelected ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30" : "border-slate-200 dark:border-gray-700",
                  emerald: isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "border-slate-200 dark:border-gray-700"
                };
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange("leave_category", key)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${colorClasses[info.color]}`}
                  >
                    <Icon size={18} className={`${isSelected ? `text-${info.color}-600` : "text-slate-500"} mb-1`} />
                    <p className={`text-sm font-medium ${isSelected ? `text-${info.color}-700 dark:text-${info.color}-400` : "text-slate-600 dark:text-slate-400"}`}>
                      {info.label}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {currentCategoryInfo.description}
            </p>
          </div>

          {/* Special Leave Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Special Leave Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(specialLeaveInfo).map(([key, info]) => {
                const Icon = info.icon;
                const isSelected = form.special_leave_type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange("special_leave_type", key)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30"
                        : "border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <Icon size={18} className={`${isSelected ? "text-brand-600" : "text-slate-500"} mb-1`} />
                    <p className={`text-sm font-medium ${isSelected ? "text-brand-700 dark:text-brand-400" : "text-slate-600 dark:text-slate-400"}`}>
                      {info.label}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {currentSpecialInfo.description}
            </p>
          </div>

          {/* Alternate Faculty Recommendations (Faculty only) */}
          {userRole === "faculty" && (
            <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={() => setShowRecs(!showRecs)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <Users size={16} />
                {showRecs ? "Hide" : "Show"} Recommended Alternate Faculty
                <span className="text-xs text-slate-400">(Optional)</span>
              </button>
              
              {showRecs && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Suggest up to 3 faculty members who can manage duties during your leave
                  </p>
                  {[0, 1, 2].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                      placeholder={`Alternate faculty ${idx + 1} (optional)`}
                      value={recommendations[idx]}
                      onChange={(e) => updateRecommendation(idx, e.target.value)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              <Upload size={16} className="inline mr-1" />
              Attachment {form.special_leave_type === "od" && <span className="text-rose-500">(Required for OD)</span>}
            </label>
            <input
              type="file"
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-950 dark:file:text-brand-400"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 16MB)
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Leave *
            </label>
            <textarea
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none resize-none"
              rows={4}
              placeholder="Please provide a detailed reason for your leave request..."
              value={form.reason}
              onChange={(e) => onChange("reason", e.target.value)}
              required
            />
          </div>
        </div>

        {/* Form Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
          {msg && (
            <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 ${
              msgType === "success" 
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
            }`}>
              {msgType === "success" ? <CheckCircle size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
              <span className="text-sm">{msg}</span>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Leave Request"}
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="px-6 py-3 rounded-xl border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}