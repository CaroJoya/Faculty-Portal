import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

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
    end_date: "",
    paid_leave_quota: 28
  });
  const [current, setCurrent] = useState({ summer: null, winter: null });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/headclerk/summer-winter/current").then((r) => setCurrent(r.data || {}));
  }, []);

  useEffect(() => {
    const quota = form.vacation_type === "Summer Vacation" ? 28 : 21;
    setForm((f) => ({ ...f, paid_leave_quota: quota }));
  }, [form.vacation_type]);

  useEffect(() => {
    if (form.start_date) {
      setForm((f) => ({ ...f, end_date: addDays(f.start_date, 39) }));
    }
  }, [form.start_date]);

  const totalDays = useMemo(() => {
    if (!form.start_date || !form.end_date) return 0;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  }, [form.start_date, form.end_date]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/headclerk/summer-winter/set", form);
      setMsg("Saved successfully");
      const { data } = await api.get("/headclerk/summer-winter/current");
      setCurrent(data || {});
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-white rounded-2xl p-5 shadow grid md:grid-cols-2 gap-3">
        <h2 className="md:col-span-2 text-2xl font-bold">40-Day Summer/Winter Vacation</h2>
        <select className="border rounded-xl p-3" value={form.vacation_type} onChange={(e) => setForm({ ...form, vacation_type: e.target.value })}>
          <option>Summer Vacation</option>
          <option>Winter Vacation</option>
        </select>
        <input type="number" className="border rounded-xl p-3" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
        <input type="date" className="border rounded-xl p-3" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
        <input type="date" className="border rounded-xl p-3 bg-slate-100" value={form.end_date} readOnly />
        <input type="number" className="border rounded-xl p-3 bg-slate-100" value={form.paid_leave_quota} readOnly />
        <div className="border rounded-xl p-3 bg-slate-50">Total days: {totalDays}</div>
        <button className="md:col-span-2 bg-brand-600 text-white rounded-xl p-3">Save Period</button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4">
          <h3 className="font-bold mb-2">Active Summer</h3>
          {current.summer ? <p>{current.summer.start_date} → {current.summer.end_date}</p> : <p>Not set</p>}
        </div>
        <div className="bg-indigo-50 rounded-xl p-4">
          <h3 className="font-bold mb-2">Active Winter</h3>
          {current.winter ? <p>{current.winter.start_date} → {current.winter.end_date}</p> : <p>Not set</p>}
        </div>
      </div>

      {msg && <p className="text-sm text-indigo-700">{msg}</p>}
    </div>
  );
}