// frontend/src/pages/HeadClerkSummerWinterManagement.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { Sun, Snowflake, Calendar, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function HeadClerkSummerWinterManagement() {
  const [form, setForm] = useState({
    vacation_type: "Summer Vacation",
    year: new Date().getFullYear(),
    start_date: "",
    end_date: ""
  });
  const [current, setCurrent] = useState({ summer: null, winter: null });
  const [facultyStatus, setFacultyStatus] = useState([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (form.start_date) {
      setForm(f => ({ ...f, end_date: addDays(f.start_date, 39) }));
    }
  }, [form.start_date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentRes, facultyRes] = await Promise.all([
        api.get("/headclerk/summer-winter/current"),
        api.get("/headclerk/vacation/faculty-status")
      ]);
      setCurrent(currentRes.data || {});
      setFacultyStatus(facultyRes.data || []);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const totalDays = useMemo(() => {
    if (!form.start_date || !form.end_date) return 0;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }, [form.start_date, form.end_date]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setMsgType("");
    setLoading(true);
    
    try {
      await api.post("/headclerk/summer-winter/set", form);
      setMsgType("success");
      setMsg(`${form.vacation_type} period saved successfully!`);
      await loadData();
      setForm({ ...form, start_date: "", end_date: "" });
      setTimeout(() => setMsg(""), 5000);
    } catch (err) {
      setMsgType("error");
      setMsg(err?.response?.data?.message || "Failed to save period");
    } finally {
      setLoading(false);
    }
  };

  const getQuota = (type) => {
    return type === "Summer Vacation" ? 27 : 21;
  };

  const totalFaculty = facultyStatus.length;
  const facultyWithSummerRemaining = facultyStatus.filter(f => f.summer_remaining > 0).length;
  const facultyWithWinterRemaining = facultyStatus.filter(f => f.winter_remaining > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Summer/Winter Vacation Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure 40-day vacation periods and track usage</p>
      </div>

      {/* Current Periods Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-5 ${current.summer ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-slate-100 dark:bg-gray-800"} text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <Sun size={28} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">40 Days</span>
          </div>
          <h3 className="text-lg font-bold">Summer Vacation</h3>
          {current.summer ? (
            <>
              <p className="text-sm opacity-90 mt-1">{current.summer.start_date} → {current.summer.end_date}</p>
              <p className="text-sm opacity-90">Quota: {getQuota("Summer Vacation")} days</p>
            </>
          ) : (
            <p className="text-sm opacity-80 mt-2">No active summer period set</p>
          )}
        </div>

        <div className={`rounded-2xl p-5 ${current.winter ? "bg-gradient-to-br from-sky-500 to-blue-600" : "bg-slate-100 dark:bg-gray-800"} text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <Snowflake size={28} />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">40 Days</span>
          </div>
          <h3 className="text-lg font-bold">Winter Vacation</h3>
          {current.winter ? (
            <>
              <p className="text-sm opacity-90 mt-1">{current.winter.start_date} → {current.winter.end_date}</p>
              <p className="text-sm opacity-90">Quota: {getQuota("Winter Vacation")} days</p>
            </>
          ) : (
            <p className="text-sm opacity-80 mt-2">No active winter period set</p>
          )}
        </div>
      </div>

      {/* Set New Period Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <h2 className="font-semibold text-slate-800 dark:text-white">Set New Vacation Period</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configure a 40-day summer or winter vacation period</p>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Vacation Type
              </label>
              <select
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                value={form.vacation_type}
                onChange={(e) => setForm({ ...form, vacation_type: e.target.value, start_date: "", end_date: "" })}
              >
                <option value="Summer Vacation">Summer Vacation</option>
                <option value="Winter Vacation">Winter Vacation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Year
              </label>
              <input
                type="number"
                className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-400 outline-none"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                required
              />
            </div>
          </div>

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
              End Date (Auto-calculated)
            </label>
            <input
              type="date"
              className="w-full border border-slate-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              value={form.end_date}
              readOnly
              disabled
            />
          </div>

          {form.start_date && (
            <div className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-xl">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total days: <strong className="text-slate-800 dark:text-white">{totalDays}</strong> (must be 40 days)
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Paid leave quota: <strong className="text-slate-800 dark:text-white">{getQuota(form.vacation_type)} days</strong>
              </p>
            </div>
          )}

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
            disabled={loading || totalDays !== 40}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : `Set ${form.vacation_type} Period`}
          </button>
        </form>
      </div>

      {/* Faculty Vacation Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">Faculty Vacation Status</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Summer and winter vacation usage by faculty</p>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">Summer: 27 days quota</span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">Winter: 21 days quota</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-900/50">
              <tr className="border-b border-slate-200 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Faculty</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Department</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Summer (Used/Remaining)</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Winter (Used/Remaining)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {facultyStatus.map((f) => (
                <tr key={f.username} className="hover:bg-slate-50 dark:hover:bg-gray-900/30">
                  <td className="p-4">
                    <p className="font-medium text-slate-800 dark:text-white">{f.full_name}</p>
                    <p className="text-xs text-slate-400">{f.username}</p>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{f.department}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{f.summer_used}/{27}</span>
                          <span className="text-emerald-600">{f.summer_remaining} left</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(f.summer_used / 27) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{f.winter_used}/{21}</span>
                          <span className="text-emerald-600">{f.winter_remaining} left</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(f.winter_used / 21) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {facultyStatus.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">No faculty data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Summer Vacation Stats</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalFaculty}</p>
              <p className="text-xs text-slate-500">Total Faculty</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{facultyWithSummerRemaining}</p>
              <p className="text-xs text-slate-500">Have Remaining Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{totalFaculty - facultyWithSummerRemaining}</p>
              <p className="text-xs text-slate-500">Fully Utilized</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Winter Vacation Stats</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalFaculty}</p>
              <p className="text-xs text-slate-500">Total Faculty</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{facultyWithWinterRemaining}</p>
              <p className="text-xs text-slate-500">Have Remaining Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{totalFaculty - facultyWithWinterRemaining}</p>
              <p className="text-xs text-slate-500">Fully Utilized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}