import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { Clock3, CheckCircle2, Hourglass, CalendarDays, PlusCircle } from "lucide-react";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [hours, setHours] = useState("");
  const [recent, setRecent] = useState([]);

  const load = async () => {
    const [meRes, statusRes, leaveRes] = await Promise.all([
      api.get("/me"),
      api.get("/leave-requests/status"),
      api.get("/leave-requests")
    ]);
    setMe(meRes.data);
    setStatus(statusRes.data);
    setRecent((leaveRes.data || []).slice(0, 5));
  };

  useEffect(() => {
    load();
  }, []);

  const totalAvailable = useMemo(() => {
    if (!me) return 0;
    return Number(me.medical_leave_left || 0) + Number(me.casual_leave_left || 0) + Number(me.earned_leave_left || 0);
  }, [me]);

  const submitOverwork = async () => {
    if (!hours) return;
    await api.post("/extra-work", {
      work_date: new Date().toISOString().slice(0, 10),
      reason: "Manual overwork entry from dashboard",
      work_type: "holiday",
      hours_worked: Number(hours)
    });
    setHours("");
    load();
  };

  if (!me) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl p-6 bg-gradient-to-r from-brand-700 to-indigo-700 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Welcome, {me.full_name}</h2>
        <p className="text-blue-100">{me.department} • {me.role}</p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <Card icon={Hourglass} title="Pending Requests" value={status.pending} color="text-amber-600" />
        <Card icon={CheckCircle2} title="Approved Requests" value={status.approved} color="text-emerald-600" />
        <Card icon={CalendarDays} title="Total Leaves Available" value={totalAvailable} color="text-brand-700" subtitle={
          <div className="flex gap-2 mt-2 text-xs">
            <Badge text={`Medical: ${me.medical_leave_left}`} />
            <Badge text={`Casual: ${me.casual_leave_left}`} />
            <Badge text={`Earned: ${me.earned_leave_left}`} />
          </div>
        } />
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow">
          <h3 className="font-semibold text-slate-800 mb-3">Overwork Hours Tracking</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Mini label="Overwork Hours" value={me.overwork_hours} />
            <Mini label="Pending Hours" value={me.pending_overwork_hours} />
            <Mini label="Earned Leave" value={me.earned_leave_left} />
            <Mini label="Auto Conversion Rule" value="5h = 1 leave" />
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="number"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Add hours"
              className="border rounded-xl p-2 w-40"
            />
            <button onClick={submitOverwork} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
              <PlusCircle size={16} />
              Add
            </button>
          </div>

          <div className="mt-4">
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-brand-500 to-indigo-500"
                style={{ width: `${Math.min((Number(me.pending_overwork_hours || 0) / 5) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow">
          <h3 className="font-semibold text-slate-800 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QLink to="/request-leave" label="Request Leave" />
            <QLink to="/status" label="Check Status" />
            <QLink to="/history" label="View History" />
            <QLink to="/stats" label="View Analytics" />
          </div>
          <div className="mt-4 p-3 rounded-xl bg-indigo-50 text-indigo-700 text-sm">
            Vacation card: Track summer/winter earned vacation in your profile and stats page.
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-5 shadow">
        <h3 className="font-semibold text-slate-800 mb-3">Recent Activities</h3>
        <div className="space-y-2">
          {recent.map((r) => (
            <div key={r.id} className="border rounded-xl p-3 flex justify-between text-sm">
              <span>{r.leave_category} • {r.start_date} to {r.end_date}</span>
              <span className="font-semibold">{r.status}</span>
            </div>
          ))}
          {recent.length === 0 && <p className="text-slate-500 text-sm">No activities yet.</p>}
        </div>
      </section>
    </div>
  );
}

function Card({ icon: Icon, title, value, color, subtitle }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <div className="flex items-center gap-3">
        <Icon className={color} />
        <h4 className="text-slate-600">{title}</h4>
      </div>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      {subtitle}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-slate-500">{label}</p>
      <p className="font-bold text-slate-800">{value}</p>
    </div>
  );
}

function Badge({ text }) {
  return <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{text}</span>;
}

function QLink({ to, label }) {
  return (
    <Link to={to} className="rounded-xl p-3 bg-gradient-to-r from-brand-50 to-indigo-50 border hover:shadow text-sm font-medium">
      {label}
    </Link>
  );
}