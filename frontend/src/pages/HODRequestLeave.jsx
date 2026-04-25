import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Clock,
  TrendingUp,
  Info
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HODRequestLeave() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [activeTab, setActiveTab] = useState("regular");
  
  // Regular leave form
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    leave_type: "full_day",
    leave_category: "casual",
    special_leave_type: "regular",
    reason: ""
  });
  const [attachment, setAttachment] = useState(null);
  const [recommendations, setRecommendations] = useState(["", "", ""]);
  const [showRecs, setShowRecs] = useState(false);

  // Overwork form
  const [overworkForm, setOverworkForm] = useState({
    work_date: "",
    hours: "",
    reason: "",
    work_type: "holiday"
  });
  const [overworkAttachment, setOverworkAttachment] = useState(null);
  const [overworkSubmitting, setOverworkSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMe(res.data);
    } catch (err) {
      console.error("Failed to load user data", err);
    } finally {
      setLoading(false);
    }
  };

  const duration = useMemo(() => {
    if (!form.start_date) return 0;
    if (form.leave_type === "half_day") return 0.5;
    if (!form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  }, [form.start_date, form.end_date, form.leave_type]);

  const overworkEarnedLeaves = useMemo(() => {
    const hours = parseFloat(overworkForm.hours) || 0;
    return Math.floor(hours / 5);
  }, [overworkForm.hours]);

  const checkLeaveBalance = () => {
    if (!me) return true;
    const daysNeeded = duration;
    if (form.leave_category === "medical") {
      return (me.medical_leave_left || 0) >= daysNeeded;
    } else if (form.leave_category === "casual") {
      return (me.casual_leave_left || 0) >= daysNeeded;
    } else if (form.leave_category === "earned") {
      return (me.earned_leave_left || 0) >= daysNeeded;
    }
    return true;
  };

  const hasSufficientBalance = checkLeaveBalance();

  const leaveCategoryInfo = {
    casual: { icon: Sun, label: "Casual Leave", color: "amber", desc: "For personal reasons or vacation" },
    medical: { icon: Heart, label: "Medical Leave", color: "rose", desc: "For health-related issues" },
    earned: { icon: Award, label: "Earned Leave", color: "emerald", desc: "Earned through overwork" }
  };

  const specialLeaveInfo = {
    regular: { icon: Calendar, label: "Regular Leave", desc: "Standard leave request" },
    od: { icon: Briefcase, label: "On Duty (OD)", desc: "Official duty - OD letter required" },
    maternity: { icon: Baby, label: "Maternity/Paternity", desc: "Parental leave (180 days)" },
    extended_medical: { icon: Heart, label: "Extended Medical", desc: "Long-term medical leave" }
  };

  const onSubmitLeave = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    if (!form.start_date || !form.reason) {
      setMsgType("error");
      setMsg("Start date and reason are required");
      return;
    }

    const effectiveEnd = form.leave_type === "half_day" ? form.start_date : form.end_date;
    if (!effectiveEnd) {
      setMsgType("error");
      setMsg("End date is required");
      return;
    }

    if (!hasSufficientBalance) {
      setMsgType("error");
      setMsg(`Insufficient ${form.leave_category} leave balance. You need ${duration} days but have only ${me?.[`${form.leave_category}_leave_left`] || 0} days left.`);
      return;
    }

    if (form.special_leave_type === "od" && !attachment) {
      setMsgType("error");
      setMsg("OD letter upload is required for OD leave");
      return;
    }

    setSubmitting(true);
    try {
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

      setMsgType("success");
      setMsg(res.data?.message || "Leave request submitted! It will be forwarded to Principal for approval.");
      
      // Reset form
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
      
      setTimeout(() => {
        setMsg("");
        navigate("/hod/status");
      }, 2000);
    } catch (err) {
      setMsgType("error");
      setMsg(err?.response?.data?.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitOverwork = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");

    if (!overworkForm.work_date || !overworkForm.hours || !overworkForm.reason) {
      setMsgType("error");
      setMsg("Work date, hours, and reason are required");
      return;
    }

    const hours = parseFloat(overworkForm.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setMsgType("error");
      setMsg("Hours must be between 0.5 and 24");
      return;
    }

    setOverworkSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("work_date", overworkForm.work_date);
      fd.append("hours", hours);
      fd.append("reason", overworkForm.reason);
      fd.append("work_type", overworkForm.work_type);
      if (overworkAttachment) fd.append("attachment", overworkAttachment);

      const res = await axios.post(`${API}/overwork/add`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setMsgType("success");
      setMsg(res.data.message || "Overwork hours added successfully!");
      
      setOverworkForm({
        work_date: "",
        hours: "",
        reason: "",
        work_type: "holiday"
      });
      setOverworkAttachment(null);
      
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsgType("error");
      setMsg(err?.response?.data?.message || "Failed to add overwork hours");
    } finally {
      setOverworkSubmitting(false);
    }
  };

  const onChange = (key, value) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "leave_type" && value === "half_day") {
        next.end_date = next.start_date;
      }
      if (key === "start_date" && prev.leave_type === "half_day") {
        next.end_date = value;
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  const CurrentCategoryIcon = leaveCategoryInfo[form.leave_category]?.icon || Sun;
  const CurrentSpecialIcon = specialLeaveInfo[form.special_leave_type]?.icon || Calendar;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">My Leave Requests</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">As HOD, your requests go directly to Principal for approval</p>
      </div>

      {/* Leave Balance Summary */}
      {me && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-white">My Leave Balances</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{me.medical_leave_left || 0}</p>
              <p className="text-xs text-slate-500">Medical Leave</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{me.casual_leave_left || 0}</p>
              <p className="text-xs text-slate-500">Casual Leave</p>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{me.earned_leave_left || 0}</p>
              <p className="text-xs text-slate-500">Earned Leave</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("regular")}
          className={`px-5 py-2.5 rounded-t-lg font-medium transition-all ${
            activeTab === "regular"
              ? "bg-brand-600 text-white"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800"
          }`}
        >
          <FileText size={16} className="inline mr-2" />
          Regular Leave
        </button>
        <button
          onClick={() => setActiveTab("overwork")}
          className={`px-5 py-2.5 rounded-t-lg font-medium transition-all ${
            activeTab === "overwork"
              ? "bg-brand-600 text-white"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800"
          }`}
        >
          <Clock size={16} className="inline mr-2" />
          Overwork Hours
        </button>
      </div>

      {/* Info Banner for HOD */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">HOD Approval Workflow</p>
            <p className="mt-0.5">As a Department Head, your leave requests bypass HOD review and go directly to the Principal for approval.</p>
          </div>
        </div>
      </div>

      {/* Regular Leave Form */}
      {activeTab === "regular" && (
        <form onSubmit={onSubmitLeave} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
            <h2 className="font-semibold text-slate-800 dark:text-white">Leave Application Form</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Fill in the details below</p>
          </div>

          <div className="p-5 space-y-5">
            {/* Date Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
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
                  className={`w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none ${form.leave_type === "half_day" ? "bg-slate-100 dark:bg-gray-700 cursor-not-allowed" : ""}`}
                  value={form.leave_type === "half_day" ? form.start_date : form.end_date}
                  disabled={form.leave_type === "half_day"}
                  onChange={(e) => onChange("end_date", e.target.value)}
                  required={form.leave_type !== "half_day"}
                />
              </div>
            </div>

            {/* Leave Type and Duration */}
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
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange("leave_category", key)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? `border-${info.color}-500 bg-${info.color}-50 dark:bg-${info.color}-950/30`
                          : "border-slate-200 dark:border-gray-700"
                      }`}
                    >
                      <Icon size={18} className={`${isSelected ? `text-${info.color}-600` : "text-slate-500"} mb-1`} />
                      <p className={`text-sm font-medium ${isSelected ? `text-${info.color}-700 dark:text-${info.color}-400` : "text-slate-600 dark:text-slate-400"}`}>
                        {info.label}
                      </p>
                    </button>
                  );
                })}
              </div>
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
                          : "border-slate-200 dark:border-gray-700"
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
                {specialLeaveInfo[form.special_leave_type]?.desc}
              </p>
            </div>

            {/* Alternate Faculty Recommendations */}
            <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={() => setShowRecs(!showRecs)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors"
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
                      onChange={(e) => {
                        const newRecs = [...recommendations];
                        newRecs[idx] = e.target.value;
                        setRecommendations(newRecs);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Upload size={16} className="inline mr-1" />
                Attachment {form.special_leave_type === "od" && <span className="text-rose-500">(Required for OD)</span>}
              </label>
              <input
                type="file"
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Supported: PDF, DOC, DOCX, JPG, PNG (Max 16MB)
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
                placeholder="Please provide a detailed reason..."
                value={form.reason}
                onChange={(e) => onChange("reason", e.target.value)}
                required
              />
            </div>

            {/* Balance Warning */}
            {!hasSufficientBalance && form.start_date && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700 dark:text-rose-400">
                    Insufficient {form.leave_category} leave balance. You need {duration} days but have only {me?.[`${form.leave_category}_leave_left`] || 0} days remaining.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Footer */}
          <div className="p-5 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
            {msg && activeTab === "regular" && (
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
                disabled={submitting || !hasSufficientBalance}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Leave Request"}
              </button>
              <button
                type="button"
                onClick={() => {
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
                }}
                className="px-6 py-3 rounded-xl border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Overwork Form */}
      {activeTab === "overwork" && (
        <form onSubmit={onSubmitOverwork} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
            <h2 className="font-semibold text-slate-800 dark:text-white">Add Overwork Hours</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track extra working hours to earn additional leave</p>
          </div>

          <div className="p-5 space-y-5">
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-sm text-amber-700 dark:text-amber-400">
              <strong>💡 How it works:</strong> Every 5 hours of overwork = 1 earned leave day. Hours auto-convert when threshold is reached.
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Work Date *
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                  value={overworkForm.work_date}
                  onChange={(e) => setOverworkForm({ ...overworkForm, work_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Hours Worked *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                  placeholder="Enter hours (0.5 - 24)"
                  value={overworkForm.hours}
                  onChange={(e) => setOverworkForm({ ...overworkForm, hours: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Work Type
              </label>
              <select
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                value={overworkForm.work_type}
                onChange={(e) => setOverworkForm({ ...overworkForm, work_type: e.target.value })}
              >
                <option value="holiday">Holiday</option>
                <option value="weekend">Weekend</option>
                <option value="after_hours">After Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Reason / Description *
              </label>
              <textarea
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none resize-none"
                rows={3}
                placeholder="Describe the work done..."
                value={overworkForm.reason}
                onChange={(e) => setOverworkForm({ ...overworkForm, reason: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Upload size={16} className="inline mr-1" />
                Supporting Document (Optional)
              </label>
              <input
                type="file"
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-800 text-slate-800 dark:text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700"
                onChange={(e) => setOverworkAttachment(e.target.files?.[0] || null)}
              />
            </div>

            {overworkForm.hours && parseFloat(overworkForm.hours) > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-emerald-600" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    This will earn you approximately <strong>{overworkEarnedLeaves}</strong> earned leave day(s) when converted.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/50">
            {msg && activeTab === "overwork" && (
              <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 ${
                msgType === "success" 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
              }`}>
                {msgType === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span className="text-sm">{msg}</span>
              </div>
            )}
            
            <button
              type="submit"
              disabled={overworkSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {overworkSubmitting ? "Adding..." : "Add Overwork Hours"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}