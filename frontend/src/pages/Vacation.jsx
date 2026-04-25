import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Sun, Snowflake, TrendingUp, CheckCircle, AlertCircle, Clock } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Vacation() {
  const token = localStorage.getItem("token");
  const [current, setCurrent] = useState({});
  const [remaining, setRemaining] = useState({});
  const [history, setHistory] = useState([]);
  const [calc, setCalc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    vacation_type: "Summer Vacation",
    start_date: "",
    end_date: "",
    reason: ""
  });
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, r, h, cl] = await Promise.all([
        axios.get(`${API}/vacation/summer-winter/current`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/vacation/my-remaining`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/vacation/my-history`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/vacation/summer-winter/my-calculations`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCurrent(c.data || {});
      setRemaining(r.data || {});
      setHistory(h.data || []);
      setCalc(cl.data || []);
    } catch (err) {
      console.error("Failed to load vacation data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const applyVacation = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");
    
    if (!form.start_date || !form.end_date) {
      setMsgType("error");
      setMsg("Please select start and end dates");
      return;
    }
    
    setSubmitting(true);
    try {
      await axios.post(`${API}/vacation/request`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsgType("success");
      setMsg("Vacation request submitted and auto-approved!");
      setForm({ vacation_type: "Summer Vacation", start_date: "", end_date: "", reason: "" });
      load();
      setTimeout(() => setMsg(""), 5000);
    } catch (err) {
      setMsgType("error");
      setMsg(err?.response?.data?.message || "Failed to submit vacation request");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading vacation information...</p>
        </div>
      </div>
    );
  }

  const summerRemaining = remaining?.summer?.remaining ?? 27;
  const winterRemaining = remaining?.winter?.remaining ?? 21;
  const summerUsed = remaining?.summer?.used ?? 0;
  const winterUsed = remaining?.winter?.used ?? 0;
  const summerQuota = 27;
  const winterQuota = 21;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Vacation Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your summer and winter vacation leaves</p>
      </div>

      {/* Active Periods Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Summer Vacation Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Sun size={28} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">40 Days</span>
          </div>
          <h3 className="text-lg font-bold">Summer Vacation</h3>
          {current?.summer ? (
            <>
              <p className="text-sm opacity-90 mt-1">{current.summer.start_date} → {current.summer.end_date}</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex justify-between text-sm">
                  <span>Used</span>
                  <span className="font-semibold">{summerUsed}/{summerQuota} days</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                  <div className="bg-white h-2 rounded-full" style={{ width: `${(summerUsed / summerQuota) * 100}%` }} />
                </div>
                <p className="text-2xl font-bold mt-3">{summerRemaining} days remaining</p>
              </div>
            </>
          ) : (
            <p className="text-sm opacity-80 mt-2">No active summer period set</p>
          )}
        </div>

        {/* Winter Vacation Card */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Snowflake size={28} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">40 Days</span>
          </div>
          <h3 className="text-lg font-bold">Winter Vacation</h3>
          {current?.winter ? (
            <>
              <p className="text-sm opacity-90 mt-1">{current.winter.start_date} → {current.winter.end_date}</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex justify-between text-sm">
                  <span>Used</span>
                  <span className="font-semibold">{winterUsed}/{winterQuota} days</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                  <div className="bg-white h-2 rounded-full" style={{ width: `${(winterUsed / winterQuota) * 100}%` }} />
                </div>
                <p className="text-2xl font-bold mt-3">{winterRemaining} days remaining</p>
              </div>
            </>
          ) : (
            <p className="text-sm opacity-80 mt-2">No active winter period set</p>
          )}
        </div>
      </div>

      {/* Apply Vacation Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Apply Vacation Leave</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Vacation requests are auto-approved instantly</p>
        </div>
        <form onSubmit={applyVacation} className="p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Vacation Type
              </label>
              <select
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                value={form.vacation_type}
                onChange={(e) => setForm({ ...form, vacation_type: e.target.value })}
              >
                <option value="Summer Vacation">Summer Vacation</option>
                <option value="Winter Vacation" disabled={!current?.winter}>Winter Vacation</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {form.vacation_type === "Summer Vacation" ? (
                  summerRemaining > 0 ? `${summerRemaining} days available` : "No days remaining"
                ) : (
                  winterRemaining > 0 ? `${winterRemaining} days available` : "No days remaining"
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          {form.start_date && form.end_date && (
            <div className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Duration: <strong className="text-slate-800 dark:text-white">{calculateDuration()} day(s)</strong>
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reason (Optional)
            </label>
            <textarea
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none resize-none"
              rows={3}
              placeholder="Add any additional notes..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          {msg && (
            <div className={`p-3 rounded-xl flex items-start gap-2 ${
              msgType === "success" 
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
            }`}>
              {msgType === "success" ? <CheckCircle size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
              <span className="text-sm">{msg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || (form.vacation_type === "Summer Vacation" ? summerRemaining <= 0 : winterRemaining <= 0)}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Apply Vacation (Auto-Approved)"}
          </button>
        </form>
      </div>

      {/* Vacation History */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Vacation History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50">
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Period</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Days</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Approved On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {history.length > 0 ? (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30">
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {h.special_leave_type === "Summer Vacation" ? <Sun size={12} /> : <Snowflake size={12} />}
                        {h.special_leave_type === "Summer Vacation" ? "Summer" : "Winter"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{h.start_date} → {h.end_date}</td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{h.duration_days}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle size={12} />
                        {h.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                      {h.approved_at ? new Date(h.approved_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">No vacation history found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Earned Leaves from Calculations */}
      {calc.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-600" />
              <h2 className="font-semibold text-slate-800 dark:text-white">Earned Leaves from Previous Vacations</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-900/50">
                <tr className="border-b border-slate-200 dark:border-gray-700">
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Vacation Type</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Quota Days</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Used Days</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Remaining Days</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Earned Leaves</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Calculated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {calc.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-gray-900/30">
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{c.vacation_type}</td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{c.quota_days}</td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{c.used_days}</td>
                    <td className="p-4 text-sm text-slate-700 dark:text-slate-300">{c.remaining_days}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        <Clock size={12} />
                        {c.earned_leaves} earned leaves
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(c.calculated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">How Vacation Earned Leaves Work</p>
            <p className="mt-0.5">After each vacation period ends, any remaining vacation days are automatically converted to earned leaves based on the conversion rate (hours per leave). These earned leaves will be added to your regular earned leave balance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}