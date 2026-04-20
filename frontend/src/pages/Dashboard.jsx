import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const token = localStorage.getItem("token");
  const [overwork, setOverwork] = useState(null);
  const [form, setForm] = useState({ work_date: "", hours: "", reason: "" });
  const [attachment, setAttachment] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/overwork/my-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverwork(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const addOverwork = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("work_date", form.work_date);
    fd.append("hours", form.hours);
    fd.append("reason", form.reason);
    if (attachment) fd.append("attachment", attachment);

    await axios.post(`${API}/overwork/add`, fd, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
    });

    setForm({ work_date: "", hours: "", reason: "" });
    setAttachment(null);
    load();
  };

  const manualConvert = async () => {
    await axios.post(`${API}/overwork/convert`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Overwork appears on Dashboard only */}
      <section className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Overwork Hours</h2>

        <form onSubmit={addOverwork} className="grid md:grid-cols-4 gap-2 mb-4">
          <input type="date" className="border rounded px-2 py-2" value={form.work_date}
            onChange={(e) => setForm({ ...form, work_date: e.target.value })} />
          <input type="number" step="0.5" placeholder="Hours" className="border rounded px-2 py-2" value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          <input placeholder="Reason" className="border rounded px-2 py-2" value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <input type="file" className="border rounded px-2 py-2"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
          <button className="bg-blue-600 text-white px-3 py-2 rounded md:col-span-4">Add Overwork</button>
        </form>

        {overwork && (
          <>
            <div className="text-sm mb-2">
              Pending: <b>{overwork.pending_hours}</b> hrs |
              Conversion Rate: <b>{overwork.conversion_hours_per_leave}</b> hrs = 1 leave day
            </div>

            <div className="w-full bg-gray-200 rounded h-3 mb-3">
              <div
                className="bg-green-500 h-3 rounded"
                style={{ width: `${Math.min(100, overwork.progress_to_next_leave_percent || 0)}%` }}
              />
            </div>

            <button onClick={manualConvert} className="bg-purple-600 text-white px-3 py-2 rounded mb-3">
              Manual Convert
            </button>

            <div className="max-h-64 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr><th className="p-2 text-left">Date</th><th className="p-2 text-left">Hours</th><th className="p-2 text-left">Reason</th></tr>
                </thead>
                <tbody>
                  {(overwork.history || []).map((h) => (
                    <tr key={h.id} className="border-t">
                      <td className="p-2">{h.work_date}</td>
                      <td className="p-2">{h.hours || h.hours_worked}</td>
                      <td className="p-2">{h.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}