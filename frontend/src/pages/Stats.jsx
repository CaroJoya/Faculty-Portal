import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Stats() {
  const [me, setMe] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [approved, setApproved] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/me"), api.get("/leave-requests/stats"), api.get("/leave-requests/history")]).then(
      ([m, s, h]) => {
        setMe(m.data);
        setMonthly(s.data || []);
        setApproved(h.data || []);
      }
    );
  }, []);

  const chartData = useMemo(() => ({
    labels: monthly.map((m) => m.month),
    datasets: [
      {
        label: "Leave Requests",
        data: monthly.map((m) => m.total_requests),
        backgroundColor: "#3b6eff"
      }
    ]
  }), [monthly]);

  if (!me) return <div>Loading...</div>;

  const total = Number(me.medical_leave_left) + Number(me.casual_leave_left) + Number(me.earned_leave_left);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Leave Analytics</h2>

      <div className="grid md:grid-cols-4 gap-3">
        <Card t="Medical" v={me.medical_leave_left} />
        <Card t="Casual" v={me.casual_leave_left} />
        <Card t="Earned" v={me.earned_leave_left} />
        <Card t="Total" v={total} />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="font-semibold mb-3">Monthly Leave Chart</h3>
        <Bar data={chartData} />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <h3 className="font-semibold mb-3">Leave Calendar (Approved Dates)</h3>
        <div className="flex flex-wrap gap-2">
          {approved.map((a) => (
            <span key={a.id} className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm">
              {a.start_date} → {a.end_date}
            </span>
          ))}
          {approved.length === 0 && <p className="text-slate-500 text-sm">No approved leaves yet.</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow grid md:grid-cols-2 gap-3">
        <Card t="Overwork Hours" v={me.overwork_hours} />
        <Card t="Pending Overwork Hours" v={me.pending_overwork_hours} />
      </div>
    </div>
  );
}

function Card({ t, v }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-slate-500 text-sm">{t}</p>
      <p className="text-2xl font-bold text-slate-800">{v}</p>
    </div>
  );
}