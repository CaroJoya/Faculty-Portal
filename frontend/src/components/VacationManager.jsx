import { useEffect, useState } from "react";
import api from "../api/axios";

export default function VacationManager() {
  const [period, setPeriod] = useState(null);
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [calc, setCalc] = useState([]);
  const [form, setForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [p, u, h, c] = await Promise.all([
      api.get("/vacation/current-period"),
      api.get("/vacation/my-usage"),
      api.get("/vacation/my-history"),
      api.get("/vacation/summer-winter/my-calculations")
    ]);
    setPeriod(p.data.active_period);
    setUsage(u.data);
    setHistory(h.data || []);
    setCalc(c.data || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await api.post("/vacation/request", form);
      setMsg(data.message || "Vacation applied");
      setForm({ start_date: "", end_date: "", reason: "" });
      load();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="font-bold text-lg mb-2">Current Vacation Period</h3>
        {period ? (
          <p>{period.period_name}: {period.start_date} to {period.end_date}</p>
        ) : (
          <p className="text-slate-500">No active vacation period.</p>
        )}
      </div>

      {usage && (
        <div className="bg-white rounded-2xl p-4 shadow grid md:grid-cols-2 gap-3">
          <Stat t="Vacation Days Used" v={usage.vacation_days_used ?? 0} />
          <Stat t="Vacation Days Remaining" v={usage.vacation_days_remaining ?? 7} />
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-2xl p-4 shadow grid md:grid-cols-3 gap-3">
        <input type="date" className="border rounded-xl p-2" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
        <input type="date" className="border rounded-xl p-2" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
        <input className="border rounded-xl p-2" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <button className="md:col-span-3 bg-brand-600 text-white rounded-xl py-2">Apply Vacation Leave</button>
      </form>

      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <h3 className="font-bold text-lg mb-2">Vacation History</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Period</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>
            {history.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.start_date} - {r.end_date}</td>
                <td>{r.duration_days}</td>
                <td>{r.reason}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow overflow-auto">
        <h3 className="font-bold text-lg mb-2">Summer/Winter Calculations</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b"><th className="py-2">Type</th><th>Leaves Taken</th><th>Earned Leaves</th><th>Paid Balance</th></tr></thead>
          <tbody>
            {calc.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.vacation_type}</td>
                <td>{r.leaves_taken}</td>
                <td>{r.earned_leaves}</td>
                <td>{r.paid_leave_balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {msg && <p className="text-indigo-700 text-sm">{msg}</p>}
    </div>
  );
}

function Stat({ t, v }) {
  return <div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-500">{t}</p><p className="text-2xl font-bold">{v}</p></div>;
}