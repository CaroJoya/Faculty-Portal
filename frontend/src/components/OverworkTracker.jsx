import { useEffect, useState } from "react";
import api from "../api/axios";

export default function OverworkTracker() {
  const [form, setForm] = useState({ work_date: "", hours: "", reason: "" });
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await api.get("/overwork/my-summary");
    setSummary(data);
  };

  useEffect(() => { load(); }, []);

  const addOverwork = async (e) => {
    e.preventDefault();
    setMsg("");

    const fd = new FormData();
    fd.append("work_date", form.work_date);
    fd.append("hours", form.hours);
    fd.append("reason", form.reason);
    if (file) fd.append("file", file);

    try {
      const { data } = await api.post("/overwork/add", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMsg(data.message || "Added");
      setForm({ work_date: "", hours: "", reason: "" });
      setFile(null);
      load();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Failed");
    }
  };

  const autoConvert = async () => {
    try {
      const { data } = await api.post("/overwork/auto-convert");
      setMsg(data.message || "Auto-converted");
      load();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Auto-convert failed");
    }
  };

  const requestConversion = async () => {
    try {
      const { data } = await api.post("/overwork/request-conversion");
      setMsg(data.message || "Request sent");
      load();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Request failed");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addOverwork} className="bg-white rounded-2xl p-4 shadow grid md:grid-cols-4 gap-3">
        <input type="date" className="border rounded-xl p-2" value={form.work_date} onChange={(e) => setForm({ ...form, work_date: e.target.value })} required />
        <input type="number" step="0.5" className="border rounded-xl p-2" placeholder="Hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} required />
        <input className="border rounded-xl p-2" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <input type="file" className="border rounded-xl p-2" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="md:col-span-4 bg-brand-600 text-white rounded-xl py-2">Add Overwork</button>
      </form>

      {summary && (
        <div className="bg-white rounded-2xl p-4 shadow space-y-3">
          <h3 className="font-bold text-lg">Overwork Summary</h3>
          <div className="grid md:grid-cols-4 gap-3 text-sm">
            <Stat t="Approved Hours" v={summary.approved_hours} />
            <Stat t="Converted Hours" v={summary.converted_hours} />
            <Stat t="Pending Hours" v={summary.pending_hours} />
            <Stat t="Earned Leaves" v={summary.earned_leaves_from_overwork} />
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-1">
              Progress to next leave ({summary.conversion_hours_per_leave}h): {summary.progress_to_next_leave}%
            </p>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div className="h-3 rounded-full bg-indigo-600" style={{ width: `${Math.min(100, Number(summary.progress_to_next_leave))}%` }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={autoConvert} className="px-3 py-2 rounded-xl bg-emerald-600 text-white">
              Auto Convert
            </button>
            <button onClick={requestConversion} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">
              Request Manual Conversion
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th className="py-2">Date</th><th>Hours</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {(summary.history || []).map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2">{r.work_date}</td>
                    <td>{r.hours}</td>
                    <td>{r.reason || "-"}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {msg && <p className="text-sm text-indigo-700">{msg}</p>}
    </div>
  );
}

function Stat({ t, v }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-slate-500">{t}</p>
      <p className="text-xl font-bold">{v}</p>
    </div>
  );
}